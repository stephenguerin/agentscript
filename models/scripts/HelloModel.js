var Model = AS.Model
var util = AS.util

class HelloModel extends Model {
    static defaultOptions() {
        return {
            population: 10,
            speed: 0.1,
            wiggle: 0.1,
        }
    }

    // ======================

    constructor(worldDptions) {
        super(worldDptions) // default world options if "undefined"
        Object.assign(this, HelloModel.defaultOptions())
    }
    setup() {
        this.turtles.setDefault('atEdge', 'bounce')

        this.turtles.create(this.population, t => {
            const patch = this.patches.oneOf()
            t.setxy(patch.x, patch.y)
        })

        this.turtles.ask(t => {
            if (this.population > 1)
                this.links.create(t, this.turtles.otherOneOf(t))
        })
    }

    step() {
        this.turtles.ask(t => {
            t.direction += util.randomCentered(this.wiggle)
            t.forward(this.speed)
        })
    }
}
const defaultModel = HelloModel

