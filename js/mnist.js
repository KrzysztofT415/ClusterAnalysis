const IMAGE_SIZE = 28 * 28

const MNIST_IMAGES_SPRITE_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png'
const MNIST_LABELS_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8'

let N_DATA = 65000
export class MnistData {
    async load(n = 65000) {
        N_DATA = n
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const imgRequest = new Promise((resolve, reject) => {
            img.crossOrigin = ''
            img.onload = () => {
                img.width = img.naturalWidth
                img.height = img.naturalHeight

                const datasetBytesBuffer = new ArrayBuffer(N_DATA * IMAGE_SIZE * 4)

                const chunkSize = 5000
                canvas.width = img.width
                canvas.height = chunkSize

                for (let i = 0; i < N_DATA / chunkSize; ++i) {
                    const datasetBytesView = new Float32Array(datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4, IMAGE_SIZE * chunkSize)
                    ctx.drawImage(img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width, chunkSize)

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                    for (let j = 0; j < imageData.data.length / 4; ++j) {
                        datasetBytesView[j] = imageData.data[j * 4] / 255
                    }
                }
                this.trainImages = new Float32Array(datasetBytesBuffer)
                resolve()
            }
            img.src = MNIST_IMAGES_SPRITE_PATH
        })

        const labelsRequest = fetch(MNIST_LABELS_PATH)
        const [imgResponse, labelsResponse] = await Promise.all([imgRequest, labelsRequest])

        this.trainLabels = new Uint8Array(await labelsResponse.arrayBuffer())
    }

    getTrainData = () => [this.trainImages, this.trainLabels]
}
