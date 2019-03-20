
import { KnockoutJsxFactory, JSXLayout } from "si-kolayout-jsx"
import { observable } from "si-decorators";
import "css!./content/io-board-gauge.less";
let idCounter = 0;

let styles = ["default", "two", "three", "four", "five", "six", "seven"];

const configuration = (style) => ({
    form: {
        "$schema": "http://io-board.com/schemas/forms.json",
        "type": "Form",
        "version": "1.0",
        "body": [
            {
                "type": "container",
                "items": [
                    {
                        "type": "textBlock",
                        "text": "Configurer Gauge",
                        "weight": "bolder",
                        "size": "medium"
                    },
                    {
                        "type": "input.text",
                        "name": "style",
                        "label": "Style",
                        "placeholder": "style",
                        "defaultValue": style
                    }
                ]
            }
        ],
        "actions": [
            {
                "type": "action.submit",
                "label": "Save"
            }
        ]
    }
});

let options = [
    {
        max: 100,
        dialStartAngle: -90,
        dialEndAngle: -90.001,
        value: 100,
        label: function (value) {
            return Math.round(value * 100) / 100;
        }
    },
    {
        min: -50,
        max: 50,
        dialStartAngle: 180,
        dialEndAngle: 0,
        value: 50,
        color: function (value) {
            if (value < -25) {
                return "#5ee432";
            } else if (value < 0) {
                return "#fffa50";
            } else if (value < 25) {
                return "#f7aa38";
            } else {
                return "#ef4655";
            }
        }
    },
    {
        max: 100,
        value: 50
    },
    {
        max: 30000,
        dialStartAngle: 90,
        dialEndAngle: 0,
        value: 50
    },
    {
        max: 200,
        dialStartAngle: 0,
        dialEndAngle: -180,
        value: 50
    },
    {
        max: 100,
        dialStartAngle: 90.01,
        dialEndAngle: 89.99,
        dialRadius: 10,
        showValue: false,
        value: 50
    },
    {
        max: 100,
        dialStartAngle: -90,
        dialEndAngle: -90.001,
        value: 100,
        showValue: false,
        label: function (value) {
            return Math.round(value * 100) / 100;
        }
    }
];
export class GaugeLayout extends JSXLayout<any>{
     

    

    constructor(private tileOptions, private tile, private dataProvider) {
        super({},
            <div id={`gauge_${tileOptions.id}`} class="gauge-container">
                <span class="label"></span>
            </div>
        )


    }

    gauge;

    async afterRender() {

        let values = await this.dataProvider();
        console.log(values);

        let gauge = await import("svg-gauge");
        let element = document.getElementById(`gauge_${this.tileOptions.id}`);
        element.querySelector(".label").innerHTML = "." + values.style;

        element.classList.add(values.style);
        let style = styles.indexOf(values.style);
        this.gauge = gauge(element, options[style]);
        setTimeout(() => {
            setInterval(() => {
                let value = (options[style].min || 0) +  Math.random() * (options[style].max || 100) - (options[style].min || 0)
                this.gauge.setValueAnimated(value, 5);
            }, 10000);
        }, Math.random() * 5000);
       
        this.tile.loading = false;
        //console.log("B");
    }
}
export default GaugeLayout;

export function configure() {
    return configuration(styles[Math.floor(Math.random() * styles.length)]);

}