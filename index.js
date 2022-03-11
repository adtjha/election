import express from 'express'
import fetch from 'node-fetch'
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const rawdb = new Low(new JSONFile('./db/raw.db.json'))
const tablesdb = new Low(new JSONFile('./db/tables.db.json'))
const skeletondb = new Low(new JSONFile('./db/skeleton.db.json'))

await skeletondb.read()
await tablesdb.read()
await rawdb.read()

const { raw } = rawdb.data;
const { tables } = tablesdb.data;
const { skeleton } = skeletondb.data;

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.get('/:type/:state/:constituency/:round', (req, res) => {
    const { type, state, constituency, round } = req.params
    let body = {}
    switch (type) {
        case 'raw':
            body = raw[state][constituency]
            break;
        case 'table':
            body = tables[state][constituency]
            break;
        case 'skeleton':
            // body = extractData(tables[state][constituency])[`r${round}`]
            body = skeleton[state][constituency][`r${round}`]
            break;
        default:
            break;
    }
    res.json(body)
})


app.get('/:state/:constituency/candidates', (req, res) => {
    const { state, constituency } = req.params

    const data = skeleton[state][constituency]
    let candidates = []
    for (const obj of data['r1']) {
        obj.candidate !== 'NOTA' && candidates.push({ name: obj.candidate, party: obj.party })
    }

    res.json(candidates)
})

app.get('/party/:state', (req, res) => {
    const { state } = req.params

    const data = skeleton[state]
    let candidates = {}

    for (const constituency in data) {
        for (const obj of data[constituency]['r1']) {
            const { candidate, party } = obj;
            if (candidates[party]) {
                candidates[party]['names'].push(candidate)
                candidates[party]['count'] += 1
            } else {
                candidates[party] = {
                    names: [],
                    count: 0
                }
                candidates[party]['names'].push(candidate)
                candidates[party]['count'] += 1
            }
        }
    }

    res.json({
        parties: candidates,
        count: Object.keys(candidates).length,
        seats: Object.keys(data).length
    })
})

app.get('/:state/:party',)

app.get('/candidates/:state', (req, res) => {
    const { state } = req.params

    const data = skeleton[state]
    let candidates = {}

    for (const constituency in data) {
        for (const obj of data[constituency]['r1']) {
            const { candidate, party } = obj;
            if (candidates[party]) {
                candidates[party].push(candidate)
            } else {
                candidates[party] = []
                candidates[party].push(candidate)
            }
        }
    }

    res.json(candidates)
})

app.get('/votes/:state', (req, res) => {
    const { state } = req.params

    const data = skeleton[state]
    let voteData = {
        "total": 0,
        "NOTA": 0,
        "partywise": {}
    }
    for (const constituency in data) {
        for (const round of Object.keys(data[constituency])) {
            for (const obj of data[constituency][round]) {
                let { candidate, party, votes } = obj;
                votes = parseInt(votes)
                if (candidate === 'NOTA') {
                    voteData['NOTA'] += votes
                } else {
                    if (voteData['partywise'][party]) {
                        voteData['partywise'][party] += votes
                    } else {
                        voteData['partywise'][party] = votes
                    }
                }
                voteData['total'] += votes
            }
        }
    }

    res.json(voteData)
})

app.get('/candidates/:state', (req, res) => {
    // total
    // NOTA
    // parties-wise

    const { state } = req.params

    const data = skeleton[state]
    let voteData = {
        "total": 0,
        "NOTA": 0,
        "partywise": {}
    }
    for (const constituency in data) {
        for (const round of Object.keys(data[constituency])) {
            for (const obj of data[constituency][round]) {
                let { candidate, party, votes } = obj;
                votes = parseInt(votes)
                if (candidate === 'NOTA') {
                    voteData['NOTA'] += votes
                } else {
                    if (voteData['partywise'][party]) {
                        voteData['partywise'][party] += votes
                    } else {
                        voteData['partywise'][party] = votes
                    }
                }
                voteData['total'] += votes
            }
        }
    }
    res.json(voteData)
})

// import stateConfig from './src/statesData.config.js'

/**
 * STAGE 0 : Store raw html pages related to election data.
 */

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
//     for (let i = 0; i < stateConfig.states.length; i++) {
//         console.log(`****************************${stateConfig.states[i].name}****************************`)
//         await fetchStateData(i)
//         await new Promise((resolve, reject) => setTimeout(() => resolve(), 3000))
//         console.log(`********************************************************`)
//     }
//     await db.write()
//     console.log('Fetching Data Ended')
// })()

/**
 * STAGE 1 : Cleaning out all the nonsense code, only HTML tables are kept.
 */

// const createTable = (body) => {
//     const $ = cheerio.load(body)
//     let tables = [];
//     $('.tabcontent').each((i, elem) => {
//         tables[i] = $(elem).html().replace(/\n/g, "")
//             .replace(/[\t ]+\</g, "<")
//             .replace(/\>[\t ]+\</g, "><")
//             .replace(/\>[\t ]+$/g, ">")
//     })
//     return tables.join('<br/>')
// }

// (async () => {
//     console.log('Start Fetching Data')
//     for (let i = 0; i < stateConfig.states.length; i++) {
//         console.log(`****************************${stateConfig.states[i].name}****************************`)
//         await new Promise((resolve, reject) => {
//             const state = stateConfig.states[i]
//             tables[state.name] = {}
//             for (const constituencyCode of state.constituencyList) {
//                 try {
//                     tables[state.name][constituencyCode] = {}
//                     let body = raw[state.name][constituencyCode]
//                     let formattedBody = createTable(body)
//                     tables[state.name][constituencyCode] = formattedBody
//                     console.log(`-----------------------${constituencyCode}-------------------------`)
//                 } catch (error) {
//                     reject(error)
//                 }
//             }
//             resolve()
//         })
//         console.log(`********************************************************`)
//     }
//     await tablesdb.write()
//     console.log('Fetching Data Ended')
// })()

/**
 * Stage 2 : Extract raw text data from HTML tables, and store them.
 */


// const extractData = (body) => {
//     const $ = cheerio.load(body)
//     const tableData = {};

//     $('.round-tbl').each((i, elem) => {
//         const table = $(elem).html()
//         const head = $(elem).children().first().children().last().html()
//         const body = $(elem).children().last().html()
//         const roundData = []
//         $(body).each((i, e) => {
//             roundData[i] = {}
//             $(e).children().each((j, f) => {
//                 if ($(f).text() !== "") {
//                     switch (j) {
//                         case 0:
//                             roundData[i]["candidate"] = $(f).text()
//                             break;
//                         case 1:
//                             roundData[i]["party"] = $(f).text()
//                             break;
//                         case 3:
//                             roundData[i]["votes"] = $(f).text()
//                             break;
//                     }
//                 }
//             })
//         })

//         roundData.pop()

//         tableData[`r${i + 1}`] = roundData
//     })

//     return tableData
// }

// (async () => {
//     console.log('Start Extracting Data')
//     for (let i = 0; i < stateConfig.states.length; i++) {
//         console.log(`****************************${stateConfig.states[i].name}****************************`)
//         await new Promise((resolve, reject) => {
//             const state = stateConfig.states[i]

//             skeleton[state.name] = {}

//             for (const constituencyCode of state.constituencyList) {
//                 try {
//                     skeleton[state.name][constituencyCode] = {}

//                     let body = tables[state.name][constituencyCode]

//                     let data = extractData(body)

//                     skeleton[state.name][constituencyCode] = data

//                     console.log(`-----------------------${constituencyCode}-------------------------`)
//                 } catch (error) {
//                     reject(error)
//                 }
//             }
//             resolve()
//         })
//         console.log(`********************************************************`)
//     }
//     await skeletondb.write()
//     console.log('Extracting Data Ended')
// })()
