let max_iterations = 20

const compareCentroids = (a, b) => {
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false
    }
    return true
}
const shouldStop = (oldCentroids, centroids, iterations) => {
    if (iterations > max_iterations) return true
    if (!oldCentroids || !oldCentroids.length) return false
    let sameCount = true
    for (let i = 0; i < centroids.length; ++i) {
        if (!compareCentroids(centroids[i], oldCentroids[i])) sameCount = false
    }
    // return centroids.some((centroid, i) => centroid.some((val, j) => val !== oldCentroids[i][j]))
    return sameCount
}

const getDistanceSQ = (a, b) => {
    const diffs = []
    for (let i = 0; i < a.length; ++i) diffs.push(a[i] - b[i])
    return diffs.reduce((r, e) => (r + (e * e)))
}
const getLabels = (dataSet, realLabels, centroids) => {
    const labels = {}
    for (let c = 0; c < centroids.length; ++c)
        labels[c] = { points: [], centroid: centroids[c], means: [], real: [] }

    for (let i = 0; i < dataSet.length; ++i) {
        const a = dataSet[i]
        let closestCentroid = centroids[0], closestCentroidIndex = 0, prevDistance = getDistanceSQ(a, closestCentroid)

        for (let j = 1; j < centroids.length; ++j) {
            let centroid = centroids[j]
            let distance = getDistanceSQ(a, centroid)
            if (distance < prevDistance) {
                prevDistance = distance
                closestCentroid = centroid
                closestCentroidIndex = j
            }
        }

        labels[closestCentroidIndex].points.push(a)
        labels[closestCentroidIndex].means.push(prevDistance)
        labels[closestCentroidIndex].real.push(realLabels[i])
    }
    return labels
}

const calcMeanCentroid = (dataSet, start, end) => {
    let mean = []
    for (let i = 0; i < dataSet[0].length; ++i) mean.push(0)
    for (let i = start; i < end; ++i) {
        for (let j = 0; j < dataSet[0].length; ++j) {
            mean[j] = mean[j] + dataSet[i][j] / (end - start)
        }
    }
    return mean
}
const getRandomCentroidsNaiveSharding = (dataset, k) => {
    const step = Math.floor(dataset.length / k)
    const centroids = []
    for (let i = 0; i < k; ++i) {
        const start = step * i
        let end = step * (i + 1)
        if (i + 1 === k) end = dataset.length
        centroids.push(calcMeanCentroid(dataset, start, end))
    }
    return centroids
}

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min) + min)
const getRandomCentroids = (dataset, k) => {
    const centroidsIndex = []
    let index
    while (centroidsIndex.length < k) {
        index = randomBetween(0, dataset.length)
        if (centroidsIndex.indexOf(index) === -1) {
            centroidsIndex.push(index)
        }
    }
    const centroids = []
    for (let i = 0; i < centroidsIndex.length; ++i) {
        const centroid = [...dataset[centroidsIndex[i]]]
        centroids.push(centroid)
    }
    return centroids
}
const getPointsMean = pointList => {
    const means = []
    for (let j = 0; j < pointList[0].length; ++j) means.push(0)

    for (let i = 0; i < pointList.length; ++i) {
        const point = pointList[i]
        for (let j = 0; j < point.length; ++j) {
            means[j] = means[j] + point[j] / pointList.length
        }
    }
    return means
}
const recalculateCentroids = (dataSet, labels) => {
    let newCentroid
    const newCentroidList = []
    for (const k in labels) {
        const centroidGroup = labels[k]
        if (centroidGroup.points.length > 0) newCentroid = getPointsMean(centroidGroup.points)
        else newCentroid = getRandomCentroids(dataSet, 1)[0]

        newCentroidList.push(newCentroid)
    }
    return newCentroidList
}

export function KMeans(dataset, realLabels, k, max, useNaiveSharding = true) {
    let iterations = 0, oldCentroids = null, labels, centroids, max_iterations = max

    if (useNaiveSharding) centroids = getRandomCentroidsNaiveSharding(dataset, k)
    else centroids = getRandomCentroids(dataset, k)

    while (!shouldStop(oldCentroids, centroids, iterations++)) {
        document.getElementById('info').innerText += '-' + iterations + '\n'
        oldCentroids = [...centroids]
        labels = getLabels(dataset, realLabels, centroids)
        centroids = recalculateCentroids(dataset, labels, k)
    }

    const clusters = []
    for (let i = 0; i < k; ++i) clusters.push(labels[i])
    return {
        clusters: clusters,
        centroids: centroids,
        iterations: iterations,
        converged: iterations <= max_iterations
    }
}