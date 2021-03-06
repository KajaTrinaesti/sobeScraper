const express = require('express')
const path = require('path')
const { promisify } = require('util')
const fs = require('fs')
const cron = require('node-cron')
const scrapeData = require('./scraper.js')

require('dotenv').config()
const app = express()

const readFile = promisify(fs.readFile)

app.use(express.static(path.join(__dirname, 'public')))


cron.schedule('0 0 12 * * *', function() {
    scrapeData()
});


app.get('/', (req, res) => {
    
})

app.get('/file', async (req, res) => {
    let filePath = path.join(__dirname, 'scrapedFiles', 'data.csv')
    
    try {
        const data = await readFile(filePath)
    
        res.attachment('customers.csv').send(data)
    } catch {
        res.status(204)
        res.send('error')
    }
})


app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is up on port ${process.env.PORT}`)
})