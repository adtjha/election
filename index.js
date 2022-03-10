import express from 'express'
import fetch from 'node-fetch'
import cron from 'node-cron'
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio';

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

/**
 * Fetch eci website : https://results.eci.gov.in/ResultAcGenMar2022/statewiseS241.htm?st=S241 every minute for fresh data.
 * Store it in json db.
 */

app.get('/', (req, res) => {
    fetch('https://results.eci.gov.in/ResultAcGenMar2022/statewiseS241.htm?st=S241').then(response => {
        response.text().then(body => {
            const $ = cheerio.load(body);
            res.send($('#ElectionResult').json())
        }).catch(err => res.send(err))
    }).catch(err => res.send(err))
})

const data = {
    keys: [],
    values: []
}

for (let i = 0; i < 41; i++) {
    fetch(`https://results.eci.gov.in/ResultAcGenMar2022/statewiseS241.htm?st=S24${i}`).then(response => {
        response.text().then(body => {
            const $ = cheerio.load(body);
            $('#ElectionResult').children().each((i, e) => {
                if (i === 2) {
                    $(e).children().each((i, e) => {
                        data.keys.push($(e).text())
                    })
                } else if (i >= 4 && i < 13) {
                    let value = []
                    $(e).children().each((i, e) => {
                        if (i === 5 || i === 3) {
                            let str = $(e).text()
                            str = str.substring(0, str.indexOf('iParty'))
                            str = str.trim()
                            value.push(str)
                            console.log($(e).text().split('\n')[0])
                        } else {
                            value.push($(e).text())
                        }
                    })
                    data.values.push([...value]);
                }
            })
            console.log(data.values)
        }).catch(console.log)
    }).catch(console.log)
}
