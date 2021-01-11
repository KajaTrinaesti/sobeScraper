const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const neatCsv = require('neat-csv')
const path = require('path')
const util = require('util')
const objectsToCSV = require('objects-to-csv')

const readFile = util.promisify(fs.readFile)

async function getData(url) {
    try {
        let { data } = await axios.get(url)
        return data    
    } catch {

    }
}

async function scrapeDataLinks(arrayOfContainingIDs = []) {
    let page = 0
    let url = `https://www.realitica.com/?cur_page=${page}&for=Najam&pZpa=Crna+Gora&pState=Crna+Gora&type%5B%5D=&lng=hr`

    let sviLinkovi = []
    try {
        let html = await getData(url)
    
        let $ = cheerio.load(html)

        let ukupno = $('#left_column_holder > div > span > strong:nth-child(2)').text()
        let prikazPoStranici = $('#left_column_holder > div > span > strong:nth-child(1)').text().split('-')[1]

        let ukupnoStranica = Math.ceil(ukupno / prikazPoStranici)

        // console.log(ukupnoStranica)

        for(page; page < ukupnoStranica; page++) {
            try {
                if(page !== 0) {
                    html = await getData(url)
                    $ = cheerio.load(html)
                }
        
                let linkovi = $('#left_column_holder').find('.thumb_div a').toArray()
                // console.log(linkovi)

                linkovi.forEach(el => {
                    // console.log(el.attribs.href)
                    let id = el.attribs.href.split('/')[el.attribs.href.split('/').length - 1]
                    if(arrayOfContainingIDs.includes(id)) {
                        // skip
                    } else {
                        sviLinkovi.push(el.attribs.href)
                    }
                })
            } catch {

            }
            
            
        }
        return sviLinkovi
    } catch {
        console.log('error')
        return sviLinkovi
    }

}

async function scrapePage(arr) {
    let arrayData = []
    try {

        for(let i = 0; i < arr.length; i++) {
            let html = await getData(arr[i])
            let $ = cheerio.load(html)
            
            let objectData = {
                ID: 'default',
                Naslov: 'default',
                Vrsta: 'default',
                Područje: 'default',
                Lokacija: 'default',
                Cijena: 'default',
                'Spavaćih Soba': 'default',
                Kupatila: 'default',
                'Stambena Površina': 'default',
                Zemljište: 'default',
                'Parking Mjesta': 'default',
                'Od Mora (m)': 'default',
                Novogradnja: false,
                'Klima Uređaj': true,
                Opis: 'default',
                Oglasio: 'default',
                Mobitel: 'default',
                'Zadnja Promjena': 'default',
                'Web Stranica': 'default',
                Slike: 'default',
                Url: 'default'
            }


            // let testArrayyy = ['ID','Naslov','Vrsta','Područje','Lokacija','Cijena','Spavaćih Soba','Kupatila',"Stambena Površina",'Zemljište','Parking Mjesta','Od Mora (m)','Novogradnja','Klima Uređaj','Opis','Oglasio','Mobitel','Zadnja Promjena','Web Stranica','Slike','Url']

            objectData['Naslov'] = $('#listing_body h2').text()
            $('#listing_body').find('strong').toArray().forEach(el => {
                let tagName = el['children'][0].data
                let tagValue = el['next'].data
                if((tagName in objectData || tagName === 'Oglas Broj') && tagValue) {
                    tagValue = tagValue.replace(/(\r\n|\n|\r|\t)/gm, "");
                    if(tagName === 'Oglas Broj') {
                        objectData['ID'] = tagValue.slice(2)
                    } else if(tagName === 'Novogradnja' || tagName === 'Klima Uređaj') {
                        objectData[tagName] = true
                    } else {
                        objectData[tagName] = tagValue.slice(2)
                    }
                }
            })
            objectData['Oglasio'] = $('#aboutAuthor a').text()

            objectData['Web Stranica'] = 'https://www.realitica.com/' + $('#aboutAuthor a').attr("href")
            
            

            objectData['Slike'] = $('#rea_blueimp').find('a').toArray().map(el => {
                if(el.attribs.href[0] === '/') {
                    return 'https://www.realitica.com' + el.attribs.href
                }
                return el.attribs.href
            })
            objectData['Url'] = arr[i]

            arrayData.push(objectData)
        }
        
        return arrayData
    } catch(e) {
        console.log('err', e)
        return arrayData
    } 
}



// scrapePage(['https://www.realitica.com/hr/listing/1621190', 'https://www.realitica.com/hr/listing/2290984'])




async function writeToCSV() {
    try {
        const filePath = path.join(__dirname, 'scrapedFiles', 'data.csv')

        let data = await readFile(filePath)
        let parsedData = await neatCsv(data)

        let currentIDs = parsedData.map(el => {
            if(el.ID.slice(el.ID.length - 1, el.ID.length) === '\n') {
                return el.ID.slice(0, el.ID.length - 1)
            } else {
                return el.ID
            }
        })
        
        let dataLinks = await scrapeDataLinks(currentIDs)
        let dataForCSV = await scrapePage(dataLinks)
        // let dataForCSV = await scrapePage(['https://www.realitica.com/hr/listing/1621190', 'https://www.realitica.com/hr/listing/2290984'])


        console.log(dataForCSV)
        const csv = new objectsToCSV(dataForCSV)
        // console.log(csv)
        await csv.toDisk(filePath, { append: true })
    } catch {
        console.log('error')
    }
}


writeToCSV()





/**
 * 
 * Vrsta smjestaja(string), ------ Vrsta
 * područje(string),​ ----- Podrucje
 * lokacija(string), ----- Lokacija
 * broj spavaćih soba(int), ----- Spavacih Soba
 * broj kupila(int), ----- Kupatila
 * cijena(float), ----- Cijena
 * stambena površina(int,m^2), ------ Stambena Povrsina
 * zemljište(int,m^2), (default stan) Zemljiste
 * parking mjesta(int), ----- Parking Mjesta
 * od mora(metara,int), ------ Od Mora (m)
 * novogradnja(boolean), ----- Novogradnja
 * klima(boolean),​ ------ Klima Uredjaj
 * naslov(string),​ ------ Naslov
 * opis(string), ------- Opis
 * webstranica(string),​ ----- Web Stranica
 * oglasio(string),​ --------- Oglasio
 * mobilni(string), -------- Mobitel
 * ​broj/idoglasa(int), ------- ID
 * zadnja promjena (datetime), ​ ------ Zadnja Promjena
 * slike​ (lista linkova slika, string), Slike
 * ​url ------- Url
 * 
 * 
 */