import express from 'express'
import fetch from 'node-fetch'
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'


const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

await db.read()

const { raw } = db.data;

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.get('/:state/:constituency', (req, res) => {
    const { state, constituency } = req.params
    const body = raw[state][constituency]
    // const $ = cheerio.load(body)
    res.send(body)
})

// For each state,
// create a file of state name,
// For each constituency,
// fetch roundwise page, with code
// store in state file
// Create a singleton writer

// import stateConfig from './src/statesData.config'

// const fetchStateData = async (index) => {
//     return new Promise(async (resolve, reject) => {
//         let clist = stateConfig.states[index].constituencyList;
//         raw[stateConfig.states[index].name] = {}
//         for (let c = 0; c < clist.length; c++) {
//             try {
//                 console.log(`------------------------${stateConfig.states[index].code} - ${clist[c]} - ${c}------------------------`)
//                 let url = `https://results.eci.gov.in/ResultAcGenMar2022/Roundwise${stateConfig.states[index].code}${clist[c]}.htm?ac=${clist[c]}`
//                 raw[stateConfig.states[index].name][clist[c]] = {}
//                 const response = await fetch(url)
//                 const body = await response.text()
//                 console.log(body)
//                 raw[stateConfig.states[index].name][clist[c]] = body
//                 console.log(`------------------------------------------------`)
//                 await new Promise((resolve, reject) => setTimeout(() => resolve(), 3000))
//             } catch (error) {
//                 reject(error)
//             }
//         }
//         resolve()
//     })
// }

// (async () => {
//     console.log('Start Fetching Data')
//     for (let i = 0; i <= stateConfig.states.length; i++) {
//         if (i === 0 || i === 2) {
//             console.log(`****************************${stateConfig.states[i].name}****************************`)
//             await fetchStateData(i)
//             await new Promise((resolve, reject) => setTimeout(() => resolve(), 3000))
//             console.log(`********************************************************`)
//         }
//     }
//     await db.write()
//     console.log('Fetching Data Ended')
// })()
