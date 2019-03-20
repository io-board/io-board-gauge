# IO-Board Gauge Element

Gauge Element for https://io-board.com (IO Dashboard)

## Try it

1. go to https://io-board.com 
2. press sign in in top corner (or just go to https://io-board.com/dashboard/)
3. Click "Configure" in the left explorer
4. Copy paste the following into the editor and press save.
```
[
    {
        "id": "io-board-gauge",
        "version": "1.0.2-pre1",
        "npm": true,
        "upgradeInfo": [
            {
                "version": "^1.0.0",
                "delay": "0h",
                "pre": true
            }
        ],
        "packages": [
            {
                "name": "{{$.id}}/{{$.version}}",
                "location": [
                    "https://cdn.io-board.com/npm/{{$.id}}/{{$.version}}/dist"
                ],
                "main": "{{$.id}}/{{$.version}}/src/io-board.json"
            }
        ]
    }
]
```
5. It will reload and you can close the editor
6. click new in left explorer and pick Gauge. You may skip the endpoint, and it will do some random data. If providing an endpoint, it will load it with fetch() at each interval specified, and using jsonPath you can query the path in the returned json to a value.
7. If you like, go over the code here and read the readme here to get an idea about how easy it is to add your own parts.

## How it was made

Using NPM the following dependencies are installed for both implementation and build tasks.
```
mkdir io-board-gauge
cd io-board-gauge
npm init
npm install svg-gauge @types/knockout knockout si-kolayout si-kolayout-jsx typescript si-decorators grunt grunt-contrib-copy grunt-npmcopy grunt-contrib-less grunt-contrib-requirejs less-plugin-autoprefix less-plugin-clean-css strip-json-comments
```

Create an io-board.json configuration file that will end up being part of the content package.

```
touch src/io-board.json
```

with the following content
```json
{
  "id": "io-board-gauge",
  "version": "1.0.2", 
  "dependencies": {
    "svg-gauge": "{{$.id}}/libs/svg-gauge/gauge.min"
  },
  "tiles": [
    {
      "settings": {
        "name": "Gauge",
        "assetTypeName": "",
        "rowSpan": 2,
        "colSpan": 2,
        "configuration": "{{$.id}}/src/index"
      }
    }
  ]
}
```

https://io-board.com will use this file to configure its module loading and make the tiles under `tiles` accessible in the new menu. 
* Col and row span settings are the initial size of the tile. 
* name is displayed in the create new list
* configuration is path where it can find the configuration provider and default layout. Module resolution is within the package itself due to the prefixed `io-board-gauge`
* dependencies on svg-gauge is also given, as the path within the distributed package.


A quick implementation of a gauge is made in index.tsx, that allows by configuration to pick between 6 styles and then it randomly changes the value of the gauge. A later version will illustrate how to interface with real data.

The example shows how one also can depend on less files for styling.

```ts

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
```

If you have questions to the example, feel free to open a ticket here and we will discuss it.

## Run it
You make also run it locally and test it on https://io-board.com 
```
git clone
npm install
npm run serve
```
will build and set up a http server on lcoalhost: `http://127.0.0.1:8080`

To add the local module to IO Dashboard
1. Go to https://io-board.com/dashboard/
2. Press Configuration in left explorer.
3. Paste the following configuration in (or add it to the list)
```
[
    {
        "id": "io-board-gauge",
        "version": "1.0.2-pre1",
        "upgradeInfo": [
            {
                "version": "^1.0.0",
                "delay": "0h",
                "pre": true
            }
        ],
        "packages": [
            {
                "name": "{{$.id}}/{{$.version}}",
                "location": [
                    "http://127.0.0.1:8080/dist"                   
                ],
                "main": "{{$.id}}/{{$.version}}/src/io-board.json"
            }
        ]
    }
]
```
4. Now click new and add a Gauge




