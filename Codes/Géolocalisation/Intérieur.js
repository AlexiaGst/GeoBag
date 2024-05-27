/* Important : Ce code est fait pour fonctionner uniquement à Valrose, il utilise donc les gateways Valrose et Liegeard.
Il est possible de le faire fonctionner en dehors de valrose en modifiant l'array loc_gat et en ajoutant quelques variables.
*/


var loc_gat = [{nom:"inspe-nice-liegeard", lat: 43.72272,lon: 7.25341,alt: 197},{nom:'valrose',lat: 43.7163678312044, lon: 7.26855227658707,alt: 0}]
var dist_gat=1.407;
var nbr = msg.payload.uplink_message.rx_metadata.length;

var puiss = [];
var noms=[];
var msg1={};
var pe=10**((14-30)/10); //puissance envoyée

for (let i = 0; i < nbr; i++) {
    puiss.push(msg.payload.uplink_message.rx_metadata[i].rssi);
    noms.push(msg.payload.uplink_message.rx_metadata[i].gateway_ids.gateway_id);
}


var d=[];



for(let i=0; i<nbr; i++) {
    var pr=10**((puiss[i]-30)/10); //puissance reçue 
    var c = 3*(10**8);

    var res=(c/(4*Math.PI*868000000))*((pe/pr)**(1/2));
    
    d.push(res/1000);
    if (i===1 && d[0]>1.407){
        d[1]=d[1]*(-1);
    }
    else if (i===1 && d[1]>1.407){
        d[0]=d[0]*(-1);
    }
}



function degToRad(deg){
    return deg*(Math.PI / 180);
}

function radToDeg(rad) {
    return rad / (Math.PI / 180);
}

if(nbr>1 && "inspe-nice-liegeard"in noms){

    var lie=d[0];
    var val=dist_gat-d[1];
    var y0=d[0]+d[1]+dist_gat;

    var L1x = [];
    var L2x = [];
    var L1y = [];
    var L2y = [];

    for(let i=0; i<720;i++) {
        var x1 = lie+d[0]*Math.cos(degToRad(i/2));
        var y1 = y0+d[0]*Math.sin(degToRad(i/2));
        L2x.push(x1);
        L2y.push(y1);

        var x2 = val + d[1] * Math.cos(degToRad(i / 2));
        var y2 = y0 + d[1] * Math.sin(degToRad(i / 2));
        L1x.push(x2);
        L1y.push(y2);
    }

    var res1 = [];
    var azimut = [];

    for (var i = 0; i < 720; i++) {
        for (var j = 0; j < 720; j++) {
            if (L1x[i] < (L2y[j]+2) && L1x[i] > (L2y[j]-2)){
                if (L1y[i] < (L2y[j]+1) && L1y[i] > (L2y[j] - 1)){
                    res1.push([L1x[i], L2y[j]]);
                    azimut.push([i,j]);
                }
            }
        }
    }

    var moy=0;
    var moy1=0;

    for (var el of azimut.slice(0, parseInt(azimut.length / 2))) {
        moy = moy + el[1];
    }

    moy = parseInt(moy / parseInt(azimut.length / 2));
    var az1 = moy / 10;

    for (var el of azimut.slice(parseInt(azimut.length / 2), azimut.length)) {
        moy1 = moy1 + el[1];
    }

    moy1 = parseInt(moy1 / parseInt(azimut.length / 2));
    var az2 = moy1 / 10;


    var azimut_min = 60.18;

    var lat1 = degToRad(43.72273);
    var lon1 = degToRad(7.25325);
    var r = 6371;
    var lats=[];
    var lons=[];

    for (var i =0; i<2; i++){
        var az = degToRad(az1+ azimut_min*(i+1));

        var lat2 = radToDeg(Math.asin((Math.sin(lat1) * Math.cos(d[0] / r)) + (Math.cos(lat1) * Math.sin(d[0] / r) * Math.cos(az))));
        var x = Math.sin(az) * Math.sin(d[0] / r) * Math.cos(lat1);
        var y = Math.cos(d[0] / r) - Math.sin(lat1) * Math.sin(degToRad(lat2));

        var lon2 = radToDeg(lon1 + Math.atan2(x, y));

        lats.push(lat2);
        lons.push(lon2);
    }
    

    var l0=(lats[0].toString()).replace(".",",");
    var l01=(lons[0].toString()).replace(".",",");
    var l1=(lats[1].toString()).replace(".",",");
    var l11=(lons[1].toString()).replace(".",",")


    var logMsgs = [];
    logMsgs = [{
        lats:l0,
        lons:l01,
        latitude:l1,
        longitude:l11
    }];

    msg1.payload = logMsgs;
    return [msg1];

}
else if (nbr===1 || !("inspe-nice-liegeard" in noms)){
    var nom=msg.payload.uplink_message.rx_metadata[0].gateway_ids.gateway_id;
    var la;
    var lo;
    if (nom === "inspe-nice-liegeard") {
        la="43.72272";
        lo="7.25341";
    }
    else{
        la = "43.7163678312044";
        lo = "7.26855227658707";
    }
    msg1.payload=[{
        lats:la,
        lons:lo,
    }];
}
else{
    msg1.payload = [{
    }];
}
return [msg1];
