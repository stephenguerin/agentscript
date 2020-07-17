import test from 'ava'
const liveServer = require('live-server')
const puppeteer = require('puppeteer')
const shell = require('shelljs')

const port = 9008
const workers = true

liveServer.start({
    open: false,
    logLevel: 0,
    ignore: '*',
    port: port,
})

// Store model samples here:
const samplesFile = 'test/samples.txt'
// Stunt to avoid shell.echo printing str .. silent mode.
const to = str => new shell.ShellString(str + '\n').to(samplesFile)
const toEnd = str => new shell.ShellString(str + '\n').toEnd(samplesFile)

const models = shell
    .ls('models/*Model.js') // Just the Model files
    .sed(/^models\//, '')
    .sed(/Model.js$/, '')
    .replace(/\n$/, '')
    .split('\n')
    .map(str => str.charAt(0).toLowerCase() + str.slice(1))

shell.echo(models)
to('const testSamples = {')

models.forEach(async model => {
    await test.serial(model, async t => {
        // ? `http://127.0.0.1:8080/models/scripts/?${model}&seed&testing`
        const url = workers
            ? `http://127.0.0.1:${port}/models/scripts/?${model}`
            : `http://127.0.0.1:${port}/models/test.html?${model}`

        const browser = await puppeteer.launch({
            args: [
                // Let model know it is being run by Puppeteer:
                '--user-agent=Puppeteer',
                // let workers use es6 imports
                // '--enable-experimental-web-platform-features',
                // Don't know if these still needed: CI needed a while back?
                // '--no-sandbox',
                // '--disable-setuid-sandbox',
            ],
            headless: true, // use false for useful debugging!
        })
        const page = await browser.newPage()
        await page.setDefaultNavigationTimeout(200000)

        await page.goto(url)

        const sample = await page.evaluate(() => {
            return new Promise(resolve => {
                function waitOn() {
                    if (window.modelSample) {
                        return resolve(window.modelSample)
                    } else {
                        setTimeout(waitOn, 10)
                    }
                }
                waitOn()
            })
        })
        const testSample = testSamples[model]

        toEnd(`${model}:`)
        toEnd(`    '${sample}',`)
        if (model === models[models.length - 1]) toEnd('}')

        if (testSample) {
            t.is(sample, testSample)
        } else {
            t.pass()
        }

        await page.close()
        await browser.close()
    })
})

const testSamples = {
    ants:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","speed","maxPheromone","diffusionRate","evaporationRate","wiggleAngle"],"patches":6561,"patch":{"id":4174,"isFood":false,"isNest":false,"foodPheromone":0.0257680536425004,"nestPheromone":0.04021862087665316,"_diffuseNext":0,"neighbors":[4092,4093,4094,4175,4256,4255,4254,4173]},"turtles":255,"turtle":{"id":80,"theta":0.3518791910692842,"x":4.569458552541104,"y":1.147423250546478,"carryingFood":true,"pheromone":0.37713422825070403},"links":0}',
    buttons:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","cluster","done"],"patches":1089,"patch":{"id":273},"turtles":200,"turtle":{"id":136,"theta":2.283142302887487,"x":-10,"y":-16,"links":[112,150,412,438]},"links":500,"link":{"id":482,"end0":{"id":121,"theta":3.7783750618803937,"x":10,"y":9,"links":[194,200,482,484]},"end1":{"id":192,"theta":5.1900867760030405,"x":-15,"y":-8,"links":[77,274,366,454,482,499]}}}',
    diffuse:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","speed","wiggle","radius","diffuseRate","seedDelta","seedMax"],"patches":80601,"patch":{"id":45451,"ran":0.5300913129775815,"_diffuseNext":0,"neighbors":[45049,45050,45051,45452,45853,45852,45851,45450]},"turtles":2,"turtle":{"id":1,"theta":3.629027286903738,"x":141.86152785070743,"y":77.14560949853987},"links":0}',
    droplets:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","stepType","killOffworld","speed","tileDecoder","tile","elevation","dzdx","dzdy","slope","aspect","localMins"],"patches":10201,"patch":{"id":5057,"elevation":1715.3,"aspect":4.224171647403569,"neighbors":[4955,4956,4957,5058,5159,5158,5157,5056]},"turtles":10201,"turtle":{"id":7694,"theta":5.705993093306085,"x":-3.1517003662656746,"y":-21.30078782952432},"links":0}',
    exit:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","numExits","population","exits","inside","wall"],"patches":5041,"patch":{"id":4012,"neighbors4":[3941,4013,4083,4011],"turtles":[],"neighbors":[3940,3941,3942,4013,4084,4083,4082,4011]},"turtles":9,"turtle":{"id":1039,"theta":-0.7853981633974483,"x":15,"y":-22,"exit":{"id":4313,"exitNumber":0,"turtles":[]}},"links":0}',
    fire:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","density","fires","embers","patchTypes","dirtType","treeType","fireType","burnedTrees","initialTrees"],"patches":63001,"patch":{"id":52543,"type":"ember0","neighbors4":[52292,52544,52794,52542]},"turtles":0,"links":0}',
    gridPath:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","probability","walker"],"patches":100,"patch":{"id":16,"occupied":true,"ok":false,"step":11,"neighbors4":[6,17,26,15]},"turtles":39,"turtle":{"id":19,"theta":2.594664107471182,"x":5,"y":3,"links":[18,19],"choices":3},"links":38,"link":{"id":14,"end0":{"id":15,"theta":1.1688468435883475,"x":7,"y":3,"links":[14,15],"choices":3},"end1":{"id":14,"theta":1.3785909678969208,"x":7,"y":4,"links":[13,14],"choices":3}}}',
    hello3:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","radius","population","speed","wiggle"],"patches":1089,"patch":{"id":762},"turtles":100,"turtle":{"id":46,"theta":11.492609791790887,"x":-2.7383511487161725,"y":-0.3886820454633696,"z":13.315793602104954,"links":[46,50,56]},"links":100,"link":{"id":0,"end0":{"id":0,"theta":14.20933841905284,"x":11.972205280358923,"y":0.9944382230298927,"z":6.374746531864861,"links":[0,55]},"end1":{"id":82,"theta":8.905512997133032,"x":-1.2302718353373023,"y":1.3744033854891413,"z":13.474325457889599,"links":[0,5,14,68,73,82]}}}',
    hello:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","speed","wiggle"],"patches":1089,"patch":{"id":927},"turtles":10,"turtle":{"id":3,"theta":2.7061032805170213,"x":-11.510946140955705,"y":-5.2732108535965985,"links":[3,4]},"links":10,"link":{"id":9,"end0":{"id":9,"theta":-3.3554230749809055,"x":-11.573610523130423,"y":2.336477979400482,"links":[3,9]},"end1":{"id":5,"theta":-0.44541933510977116,"x":15.22704526570047,"y":-16.193063366898038,"links":[5,9]}}}',
    linkTravel:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","layoutCircle","numNodes","numDrivers","speed","speedDelta","nodes","drivers"],"patches":1089,"patch":{"id":822},"turtles":130,"turtle":{"id":13,"theta":-1.1519173063162573,"x":6.101049646137006,"y":-13.703181864639014,"links":[22,23,27,36]},"links":56,"link":{"id":48,"end0":{"id":26,"theta":-3.874630939427411,"x":-11.147172382160917,"y":10.03695909538287,"links":[48,49]},"end1":{"id":19,"theta":-2.4085543677521746,"x":-11.147172382160912,"y":-10.036959095382874,"links":[34,35,48]}}}',
    roads:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","zxy","jsonUrl","nodeCache","geojson","intersections","xfm","lineStrings"],"patches":40401,"patch":{"id":39529},"turtles":1475,"turtle":{"id":877,"theta":0.2670346998186418,"x":-34.7431640625,"y":-102.56126803705995,"lon":-105.94496011734009,"lat":35.67496441193197,"links":[961,962,1028]},"links":1661,"link":{"id":1500,"end0":{"id":1329,"theta":2.1411011291187503,"x":52.752685546875,"y":-34.100251500184804,"lon":-105.93539535999298,"lat":35.681043203879526,"links":[1499,1500]},"end1":{"id":1330,"theta":1.684455296681629,"x":51.8203125,"y":-33.85488089210083,"lon":-105.93549728393555,"lat":35.68106499083146,"links":[1500,1501]},"lineString":[1498,1499,1500,1501,1502,1503]}}',
    tsp:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","nodeCount","travelersCount","growPopulation","useInversion","stopTickDifference","nodes","travelers","done","bestTourNodes","bestTourLength","bestTourTick"],"patches":10201,"patch":{"id":6348},"turtles":150,"turtle":{"id":49358,"theta":6.2057057482528055,"x":0,"y":0,"tourNodes":[15,37,4,8,21,45,0,13,30,19,1,10,9,28,6,14,38,29,5,40,36,32,17,35,43,18,23,27,39,31,44,33,20,46,16,26,41,49,11,2,34,7,47,12,22,48,24,25,3,42],"tourLength":685.1126526519315},"links":50,"link":{"id":6045,"end0":{"id":48,"theta":5.300552062594213,"x":-21,"y":-4,"links":[6044,6045]},"end1":{"id":24,"theta":4.282976235528911,"x":-25,"y":-11,"links":[6045,6046]}}}',
    virus:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","averageNodeDegree","outbreakSize","virusSpreadPercent","virusCheckFrequency","recoveryPercent","gainResistancePercent","done"],"patches":6561,"patch":{"id":3002},"turtles":150,"turtle":{"id":15,"theta":5.354326060992883,"x":-9.349923324864283,"y":-12.260946722175877,"resistant":false,"infected":false,"state":"susceptible","virusCheckTimer":0,"links":[36,40,169,184,314,327]},"links":450,"link":{"id":413,"end0":{"id":32,"theta":4.3059879866764295,"x":-26.084254426820436,"y":-13.913646330976531,"resistant":true,"infected":false,"state":"resistant","virusCheckTimer":0,"links":[86,112,221,233,328,348,356,378,413]},"end1":{"id":144,"theta":5.1900867760030405,"x":-34.47228191769429,"y":-19.091619802328402,"resistant":false,"infected":false,"state":"susceptible","virusCheckTimer":0,"links":[7,29,156,211,240,308,413,414,416]}}}',
    wallFollower:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","population","wallPercent","walls","lefty","righty"],"patches":5041,"patch":{"id":2482,"neighbors4":[2411,2483,2553,2481]},"turtles":40,"turtle":{"id":27,"theta":1.5707963267948966,"x":17,"y":34},"links":0}',
    water:
        '{"ticks":500,"model":["ticks","world","patches","turtles","links","step0","step","strength","surfaceTension","friction","drip"],"patches":10201,"patch":{"id":6451,"zpos":-2.022592688314435,"deltaZ":-4.8107524811331555,"neighbors4":[6350,6452,6552,6450]},"turtles":0,"links":0}',
}
