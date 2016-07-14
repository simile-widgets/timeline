define(function() {
var Timespans = {};

Timespans.eons = [
    {   name: "proterozoic",
        start: 2500.000
    },
    {   name: "phanerozoic",
        start: 542.000
    }
];

Timespans.eras = [
    {   name: "paleoarchean",
        start: 3600.000
    },
    {   name: "mesoarchean",
        start: 3200.000
    },
    {   name: "neoarchean",
        start: 2800.000
    },
    {   name: "paleoproterozoic",
        start: 2500.000
    },
    {   name: "mesoproterozoic",
        start: 1600.000
    },
    {   name: "neoproterozoic",
        start: 1000.000
    },
    {   name: "paleozoic",
        start: 542.000
    },
    {   name: "mesozoic",
        start: 251.000
    },
    {   name: "cenozoic",
        start: 65.500
    }
];

Timespans.periods = [
    {   name: "siderian",
        start: 2500.000
    },
    {   name: "rhyacian",
        start: 2300.000
    },
    {   name: "orosirian",
        start: 2050.000
    },
    {   name: "statherian",
        start: 1800.000
    },
    {   name: "calymmian",
        start: 1600.000
    },
    {   name: "ectasian",
        start: 1400.000
    },
    {   name: "stenian",
        start: 1200.000
    },
    {   name: "tonian",
        start: 1000.000
    },
    {   name: "cryogenian",
        start: 850.000
    },
    {   name: "ediacaran",
        start: 600.000
    },
    {   name: "cambrian",
        start: 542.000
    },
    {   name: "ordovician",
        start: 488.300
    },
    {   name: "silurian",
        start: 443.700
    },
    {   name: "devonian",
        start: 416.000
    },
    {   name: "carboniferous",
        start: 359.200
    },
    {   name: "permian",
        start: 299.000
    },
    {   name: "triassic",
        start: 251.000
    },
    {   name: "jurassic",
        start: 199.600
    },
    {   name: "cretaceous",
        start: 145.500
    },
    {   name: "paleogene",
        start: 65.500
    },
    {   name: "neogene",
        start: 23.030
    }
];

Timespans.epochs = [
    {   name: "lower-cambrian",
        start: 542.000
    },
    {   name: "middle-cambrian",
        start: 513.000
    },
    {   name: "furongian",
        start: 501.000
    },
    {   name: "lower-ordovician",
        start: 488.300
    },
    {   name: "middle-ordovician",
        start: 471.800
    },
    {   name: "upper-ordovician",
        start: 460.900
    },
    {   name: "llandovery",
        start: 443.700
    },
    {   name: "wenlock",
        start: 428.200
    },
    {   name: "ludlow",
        start: 422.900
    },
    {   name: "pridoli",
        start: 418.700
    },
    {   name: "lower-devonian",
        start: 416.000
    },
    {   name: "middle-devonian",
        start: 397.500
    },
    {   name: "upper-devonian",
        start: 385.300
    },
    {   name: "mississippian",
        start: 359.200
    },
    {   name: "pennsylvanian",
        start: 318.100
    },
    {   name: "cisuralian",
        start: 299.000
    },
    {   name: "guadalupian",
        start: 270.600
    },
    {   name: "lopingian",
        start: 260.400
    },
    {   name: "lower-triassic",
        start: 251.000
    },
    {   name: "middle-triassic",
        start: 245.000
    },
    {   name: "upper-triassic",
        start: 228.000
    },
    {   name: "lower-jurassic",
        start: 199.600
    },
    {   name: "middle-jurassic",
        start: 175.600
    },
    {   name: "upper-jurassic",
        start: 161.200
    },
    {   name: "lower-cretaceous",
        start: 145.500
    },
    {   name: "upper-cretaceous",
        start: 99.600
    },
    {   name: "paleocene",
        start: 65.500
    },
    {   name: "eocene",
        start: 55.800
    },
    {   name: "oligocene",
        start: 33.900
    },
    {   name: "miocene",
        start: 23.030
    },
    {   name: "pliocene",
        start: 5.332
    },
    {   name: "pleistocene",
        start: 1.806
    },
    {   name: "holocene",
        start: 0.012
    }
];

Timespans.ages = [
    {   name: "age1",
        start: 542.000
    },
    {   name: "age2",
        start: 513.000
    },
    {   name: "paibian",
        start: 501.000
    },
    {   name: "tremadocian",
        start: 488.300
    },
    {   name: "age3",
        start: 478.600
    },
    {   name: "age4",
        start: 471.800
    },
    {   name: "darriwilian",
        start: 468.100
    },
    {   name: "age5",
        start: 460.900
    },
    {   name: "age6",
        start: 455.800
    },
    {   name: "hirnantian",
        start: 445.600
    },
    {   name: "rhuddanian",
        start: 443.700
    },
    {   name: "aeronian",
        start: 439.000
    },
    {   name: "telychian",
        start: 436.100
    },
    {   name: "sheinwoodian",
        start: 428.200
    },
    {   name: "homerian",
        start: 426.200
    },
    {   name: "gorstian",
        start: 422.900
    },
    {   name: "ludfordian",
        start: 421.300
    },
    {   name: "age7",
        start: 418.700
    },
    {   name: "lochkovian",
        start: 416.000
    },
    {   name: "pragian",
        start: 411.200
    },
    {   name: "emsian",
        start: 407.000
    },
    {   name: "eifelian",
        start: 397.500
    },
    {   name: "givetian",
        start: 391.800
    },
    {   name: "frasnian",
        start: 385.300
    },
    {   name: "famennian",
        start: 374.500
    },
    {   name: "tournaisian",
        start: 359.200
    },
    {   name: "visean",
        start: 345.300
    },
    {   name: "serpukhovian",
        start: 326.400
    },
    {   name: "bashkirian",
        start: 318.100
    },
    {   name: "moscovian",
        start: 311.700
    },
    {   name: "kazimovian",
        start: 306.500
    },
    {   name: "gzhelian",
        start: 303.900
    },
    {   name: "asselian",
        start: 299.000
    },
    {   name: "sakmarian",
        start: 294.600
    },
    {   name: "artinskian",
        start: 284.400
    },
    {   name: "kungurian",
        start: 275.600
    },
    {   name: "roadian",
        start: 270.600
    },
    {   name: "wordian",
        start: 268.000
    },
    {   name: "capitanian",
        start: 265.800
    },
    {   name: "wuchiapingian",
        start: 260.400
    },
    {   name: "changhsingian",
        start: 253.800
    },
    {   name: "induan",
        start: 251.000
    },
    {   name: "olenekian",
        start: 249.700
    },
    {   name: "anisian",
        start: 245.000
    },
    {   name: "ladinian",
        start: 237.000
    },
    {   name: "carnian",
        start: 228.000
    },
    {   name: "norian",
        start: 216.500
    },
    {   name: "rhaetian",
        start: 203.600
    },
    {   name: "hettangian",
        start: 199.600
    },
    {   name: "sinemurian",
        start: 196.500
    },
    {   name: "pliensbachian",
        start: 189.600
    },
    {   name: "toarcian",
        start: 183.000
    },
    {   name: "aalenian",
        start: 175.600
    },
    {   name: "bajocian",
        start: 171.600
    },
    {   name: "bathonian",
        start: 167.700
    },
    {   name: "callovian",
        start: 164.700
    },
    {   name: "oxfordian",
        start: 161.200
    },
    {   name: "kimmeridgian",
        start: 155.000
    },
    {   name: "tithonian",
        start: 150.800
    },
    {   name: "berriasian",
        start: 145.500
    },
    {   name: "valanginian",
        start: 140.200
    },
    {   name: "hauterivian",
        start: 136.400
    },
    {   name: "barremian",
        start: 130.000
    },
    {   name: "aptian",
        start: 125.000
    },
    {   name: "albian",
        start: 112.000
    },
    {   name: "cenomanian",
        start: 99.600
    },
    {   name: "turonian",
        start: 93.500
    },
    {   name: "coniacian",
        start: 89.300
    },
    {   name: "santonian",
        start: 85.800
    },
    {   name: "campanian",
        start: 83.500
    },
    {   name: "maastrichtian",
        start: 70.600
    },
    {   name: "danian",
        start: 65.500
    },
    {   name: "selandian",
        start: 61.700
    },
    {   name: "thanetian",
        start: 58.700
    },
    {   name: "ypresian",
        start: 55.800
    },
    {   name: "lutetian",
        start: 48.600
    },
    {   name: "bartonian",
        start: 40.400
    },
    {   name: "priabonian",
        start: 37.200
    },
    {   name: "rupelian",
        start: 33.900
    },
    {   name: "chattian",
        start: 28.400
    },
    {   name: "aquitanian",
        start: 23.030
    },
    {   name: "burdigalian",
        start: 20.430
    },
    {   name: "langhian",
        start: 15.970
    },
    {   name: "serravallian",
        start: 13.650
    },
    {   name: "tortonian",
        start: 11.608
    },
    {   name: "messinian",
        start: 7.246
    },
    {   name: "zanclean",
        start: 5.332
    },
    {   name: "piacenzian",
        start: 3.600
    },
    {   name: "gelasian",
        start: 2.588
    }
];

    return Timespans;
});
