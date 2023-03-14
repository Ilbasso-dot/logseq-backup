// telegram and database modules
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs')

const token = process.env.TOKEN;
const groupID = process.env.GROUPID;
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", console.log);

console.log("Bot started" + groupID);



/* Json functions */
function readData() {
    const data = fs.readFileSync('db.json', 'utf8');
    return JSON.parse(data);
}

function writeData(obj) {
    if (!obj) {
        return;
    }
    try {
        fs.writeFileSync('db.json', JSON.stringify(obj));
        console.log("overwrite")
    }
    catch (err) {
        console.log("errore", err);
    }
}

function addData(obj) {
    if (!obj) {
        return;
    }
    try {
        json_database = readData().backups;
        json_database.push(obj);
        writeData({ "backups": json_database });
        console.log("append")
    }
    catch (err) {
        console.log("errore", err);
    }
}

// from json object to file array of last backup
async function lastBackup(obj, latest = 1,  path = ".tmp") {
    if (!obj) {
        return;
    }
    try {
        let last = (obj.backups.length > latest) ? obj.backups[obj.backups.length - latest] : obj.backups[obj.backups.length - 1];
        let down = await bot.downloadFile(last.file_id, path)

        fs.renameSync(down, path + "/" + last.name);
        const data = fs.readFileSync(path + "/" + last.name, 'utf8');
        fs.unlinkSync(path + "/" + last.name);
        return JSON.parse(data).data;

    }
    catch (err) {
        console.log("errore", err);
    }
}

// from array to folder files
function downloadFromJson(obj, path = ".tmp") {
    if (!obj) {
        return;
    }
    try {
        for (let i = 0; i < obj.length; i++) {
            console.log([obj[i].file_id, path]);
            let down = bot.downloadFile(obj[i].file_id, path)
            down.then((res) => {
                fs.rename(res, path + "/" + obj[i].name, (err) => {
                    if (err) {
                        console.log("errore rinominamento", err);
                        return
                    }
                })
            }).catch(err => console.log(err))
        }
    }
    catch (err) {
        console.log("errore", err);
    }
}

// from folder files to telegram
function loadFolder(path) {
    let files = []
    fs.readdirSync(path).forEach(file => {
        files.push(file);
    });

    console.log(files);

    let obj_array = [];
    let prominses = [];

    files.forEach(file => {
        prominses.push(bot.sendDocument(groupID, path + "/" + file));
    });

    Promise.all(prominses).then((res) => {
        res.forEach((file, index) => {
            obj_array.push({ "file_id": res[index].document.file_id, "name": file.document.file_name });
        });
    }).then(() => {
        // create json file with obj_array and send it to telegram
        let time = new Date().toISOString().replace(/:/g, "-").replace("T", "_").replace("Z", "").split(".")[0];

        try {
            fs.writeFile(time + ".json", JSON.stringify({ "data": obj_array, "name": time + ".json" }), (err) => {
                if (err) {
                    console.log("errore scrittura", err);
                    return
                }
                let fil = bot.sendDocument(groupID, time + ".json");
                fil.then((res) => {
                    // add res.document.file_id to db.json
                    addData({ "file_id": res.document.file_id, "name": time + ".json" });
                }).then(() => {
                    // delete json file
                    fs.unlink(time + ".json", (err) => {
                        if (err) {
                            console.log("errore cancellazione", err);
                            return
                        }
                    });
                });
            });
        } catch (err) {
            return
        }
    });
}


bot.onText(/\/backup/, (msg, match) => {
    console.log("backup");
    bot.sendMessage(groupID, "Backup started:");
    send_backup("/home/ilbasso/Documents/logseq_folders/pages/");
})

bot.onText(/\/retrive/, (msg, match) => {
    console.log("retrive");
    bot.sendMessage(groupID, "Retriving data:");
    retrive_backup("downloads", 1);
})


const send_backup = (folder_to_backup) => {
    loadFolder(folder_to_backup);
}

const retrive_backup = (folder_to_load, latest = 1) => {
    let data = readData();
    let arr = lastBackup(data, latest);
    fs.mkdirSync(folder_to_load, { recursive: true });
    arr.then((res) => {
        console.log(res, "res");
        downloadFromJson(res, folder_to_load);
    })

}

module.exports =  { send_backup, retrive_backup };