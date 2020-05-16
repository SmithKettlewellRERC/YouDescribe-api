const moment = require("moment");

module.exports = {
    msleep: (milliSeconds) => {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliSeconds);
    },

    nowUtc: () => {
        return moment().utc().format("YYYYMMDDHHmmss");
    },

    utcToLongInt: (timestampUtc) => {
        return parseInt(moment(parseInt(timestampUtc)).format("YYYYMMDDHHmmss"));
    },

    convertISO8601ToSeconds: (input) => {
        const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        let totalseconds;
        if (reptms.test(input)) {
            const matches = reptms.exec(input);
            if (matches[1]) hours = Number(matches[1]);
            if (matches[2]) minutes = Number(matches[2]);
            if (matches[3]) seconds = Number(matches[3]);
            totalseconds = (hours * 3600) + (minutes * 60) + seconds;
        }
        return (totalseconds);
    },
    
    isJSON: (str) => {
        if (typeof str == "string") {
            try {
                var obj = JSON.parse(str);
                if(typeof obj == "object" && obj ){
                    return true;
                }else{
                    return false;
                }
            } catch(e) {
                // console.log("error：" + str + "!!!" + e);
                return false;
            }
        }
        console.log("It is not a string!")
    },

    convertISO8601ToSeconds: (input) => {
        const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        let totalseconds;
        if (reptms.test(input)) {
          const matches = reptms.exec(input);
          if (matches[1]) hours = Number(matches[1]);
          if (matches[2]) minutes = Number(matches[2]);
          if (matches[3]) seconds = Number(matches[3]);
          totalseconds = (hours * 3600) + (minutes * 60) + seconds;
        }
        return (totalseconds);
    },
}