import { MnistData } from './mnist.js'
import { KMeans } from './kmeans.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false

const info = document.getElementById('info')
info.innerText = 'Info log :\n\n'

// FETCHING DATA

let training_data, training_labels
const loadMnist = async event => {
    info.innerText += '-> Loading MNIST data\n'
    for (let data of document.getElementById('data').children) data.classList.remove('chosen')
    event.target.classList.add('chosen')

    const data = new MnistData()
    await data.load(10000)

    info.innerText += '-> Data loaded\n'

    let trainData = data.getTrainData()
    training_data = trainData[0]
    training_labels = trainData[1]

    document.getElementById('make_clusters').disabled = false
    document.getElementById('clusters_num').max = training_labels.length / 10
}
const loadImages = folder_path => {
    return new Promise((resolve, _) => {
        const SIZE = 28 ** 2
        const datasetBytesBuffer = new ArrayBuffer(30 * SIZE * 4)
        const datasetLabels = new Uint8Array(30 * 10)
        const mini = document.createElement('canvas')
        const mini_ctx = mini.getContext('2d')
        let letters = ['a', 'b', 'c']
        for (let number = 0; number < 10; ++number) {
            for (let i = 0; i < letters.length; ++i) {
                let offset = number * letters.length + i
                datasetLabels[offset * 10 + number] = 1

                let datasetBytesView = new Float32Array(datasetBytesBuffer, offset * SIZE * 4, SIZE)
                let imageToGuess = new Image()
                imageToGuess.onload = () => {
                    mini_ctx.clearRect(0, 0, mini.width, mini.height)
                    mini_ctx.drawImage(imageToGuess, 0, 0, 28, 28)
                    let imageData = mini_ctx.getImageData(0, 0, 28, 28)
                    for (let j = 0; j < imageData.data.length / 4; ++j) datasetBytesView[j] = imageData.data[j * 4] / 255
                }
                imageToGuess.id = 'imageToPredict'
                imageToGuess.width = 28
                imageToGuess.height = 28
                imageToGuess.src = './' + folder_path + '/' + number + '' + letters[i] + '.png'
            }
        }
        let datasetBytes = new Float32Array(datasetBytesBuffer)
        resolve([datasetBytes, datasetLabels])
    })
}
const loadData = async (target, folder_path) => {
    info.innerText += '-> Loading ' + folder_path + '\n'
    for (let data of document.getElementById('data').children) data.classList.remove('chosen')
    target.classList.add('chosen')

    let imageData = await loadImages(folder_path)

    training_data = imageData[0]
    training_labels = imageData[1]

    info.innerText += '-> Data loaded\n'

    document.getElementById('make_clusters').disabled = false
    document.getElementById('clusters_num').max = training_labels.length / 10
}

// CLUSTERING DATA

let clusters_result
let group = (arr, chunk) =>
    Array(arr.length / chunk)
        .fill('')
        .map((_, i) => arr.slice(i * chunk, (i + 1) * chunk))
let makeClusters = _ => {
    let clusters = document.getElementById('clusters_num').value
    if (!clusters) clusters = 10
    reloadWindow(clusters)

    info.innerText += '-> Started clustering\n'
    let data = group(training_data, 784)
    let labels = group(training_labels, 10).map(val => val.indexOf(1))
    clusters_result = KMeans(data, labels, clusters, 20)
    info.innerText += '-> Clustered loaded data\n'
    console.log(clusters_result)

    for (let i = 0; i < clusters_result.clusters.length; ++i) {
        let cluster = clusters_result.clusters[i]
        for (let j = 0; j < cluster.real.length; ++j) {
            console.log(`cl${i + 1}-nm${cluster.real[j]}`)
            let number_obj = document.getElementById(`cl${i + 1}-nm${cluster.real[j]}`)
            number_obj.innerText = (parseInt(number_obj.innerText === '-' ? 0 : number_obj.innerText) + 1).toString()
        }
    }

    let inertia = 0
    for (const cluster of clusters_result.clusters) inertia += cluster.means.reduce((sum, val) => sum + val)
    document.getElementById('inertia').innerText = inertia.toString()

    for (let button of document.getElementById('buttons').children) button.disabled = false
}
let loadCluster = i => {
    info.innerText += '-> Showing cluster ' + i + ' data\n'

    let cluster = clusters_result.clusters[i - 1].centroid
    let imageArray = new Uint8ClampedArray(3136)
    for (let j = 0; j < 784; ++j) {
        let val = Math.floor(cluster[j] * 255)
        imageArray[4 * j] = imageArray[4 * j + 1] = imageArray[4 * j + 2] = imageArray[4 * j + 3] = val
    }
    const mini = document.createElement('canvas')
    mini.width = mini.height = 28
    const mini_ctx = mini.getContext('2d')

    mini_ctx.clearRect(0, 0, mini.width, mini.height)
    mini_ctx.putImageData(new ImageData(imageArray, 28, 28), 0, 0)
    mini_ctx.drawImage(mini, 0, 0, mini.width, mini.height)

    let miniImage = new Image()
    miniImage.src = mini.toDataURL()
    miniImage.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(miniImage, 0, 0, canvas.width, canvas.height)
    }

    for (let button of document.getElementById('buttons').children) button.classList.remove('chosen')
    document.getElementById('cl' + i).classList.add('chosen')
}

// BUTTONS AND WINDOW FUNCTIONALITY

let reloadWindow = clusters => {
    let buttons = document.getElementById('buttons')
    buttons.innerHTML = ''
    for (let i = 1; i <= clusters; ++i) buttons.innerHTML += `<button id='cl${i}' disabled>${i}</button>`
    for (let i = 1; i <= clusters; ++i) document.getElementById('cl' + i).onclick = () => loadCluster(i)

    let clusters_obj = document.getElementById('clusters')
    clusters_obj.innerHTML = "<div id='clusters_numbers'></div>"
    let clusters_numbers = document.getElementById('clusters_numbers')
    clusters_numbers.innerHTML = '<label>/</label>'
    for (let i = 0; i < 10; ++i) clusters_numbers.innerHTML += `<label>${i}</label>`

    for (let i = 1; i <= clusters; ++i) {
        clusters_obj.innerHTML += `<div id='cluster${i}'></div>`
        let cluster = document.getElementById('cluster' + i)
        cluster.innerHTML = `<label>[${i}]</label>`
        for (let j = 0; j < 10; ++j) {
            cluster.innerHTML += `<label id='cl${i}-nm${j}'>-</label>`
        }
    }
}

document.getElementById('loadMnist').onclick = loadMnist
document.getElementById('loadMy').onclick = event => loadData(event.target, 'test_data_mine')
document.getElementById('loadFriend').onclick = event => loadData(event.target, 'test_data_friend')
document.getElementById('make_clusters').onclick = makeClusters

window.onload = () => reloadWindow(10)

const getInnermostHovered = _ => {
    let n = document.querySelector(':hover'),
        nn
    while (n) {
        nn = n
        n = nn.querySelector(':hover')
    }
    return nn
}
window.setInterval(_ => {
    if (getInnermostHovered() !== info) info.scrollTop = info.scrollHeight
}, 1000)
