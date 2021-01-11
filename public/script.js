let p = document.getElementById('p')
let a = document.getElementById('a')

let pokusaji = 0

let interval = setInterval(async () => {
    try {
        const data = await fetch('/file')
        pokusaji++
        if(pokusaji > 7) {
            p.innerText = 'We couldn\'t get the file right now'
            clearInterval(interval)
        } else if(data.status === 204) {
            p.innerText = 'We couldn\'t get the file right now'
            clearInterval(interval)
        } else if(data.status === 200) {
            p.innerText = 'File is ready to be downloaded!'
            a.classList.remove('disabled')
            clearInterval(interval)
        }
    } catch {
        console.log('error')
    }
}, 2000)