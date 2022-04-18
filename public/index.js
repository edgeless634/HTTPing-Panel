
const graph_max_value = 1
const line_thickness = 2

// canvas ----------------------
function drawDataIntoCanvas(canvas, data) {
    const ctx = canvas.getContext("2d");
    // set canvas
    let width = Math.max(data.length * line_thickness, 100), height = 100

    // change width if width is too big
    const parentWidth = canvas.parentNode.offsetWidth, brotherWidth = canvas.parentNode.childNodes[0].offsetWidth;
    const parentHeight = canvas.parentNode.offsetWidth;
    if(parentWidth - brotherWidth - 50 < width) {
        width = parentWidth - brotherWidth - 50
    }
    if(parentHeight < height) {
        height = parentHeight
    }
    if(canvas.width != width){
        canvas.width = width
    }
    if(canvas.height != height){
        canvas.height = height
    }
    // set max latency
    const max_latency = Math.max(...data, graph_max_value)
    // init vars
    let sum_latency = 0
    // clean
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // show data
    for (let k in data) {
        // count sum
        sum_latency += Number(data[k])
        // draw line
        let height = data[k] / max_latency * canvas.height
        if (height > canvas.height * 0.6) {
            ctx.fillStyle = "#DF2E2E"
        } else if (height > canvas.height * 0.3) {
            ctx.fillStyle = "#F6D167"
        } else {
            ctx.fillStyle = "#297F87"
        }
        ctx.fillRect(
            canvas.width - line_thickness - k * line_thickness, 
            canvas.height - height, 
            line_thickness, 
            height
        )
    }
    // write text
    ctx.font = '12px "monospace"';
    ctx.fillStyle = "grey";
    ctx.textBaseline = "top";
    ctx.textAlign = "right"
    ctx.fillText("max: " + String(max_latency).slice(0, 6) + "s", canvas.width, 0)
    ctx.fillText("avg: " + String(sum_latency / data.length).slice(0, 6) + "s", canvas.width, 14)
}

function drawAllCanvas() {
    let l = document.querySelectorAll(".canvas-datas")

    for (let i = 0; i < l.length; i++) {
        let element = l[i]
        if (!element.getAttribute("data")) {
            continue
        }
        drawDataIntoCanvas(element, element.getAttribute("data").split(","))
    }
}

// data ----------------------

now_path = window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/") + 1)

const App = {
    data() {
        return {
            name: "",
            url: "",
            datas: [
            ]
        }
    },
    methods: {
        addSite() {
            axios.post(now_path + "api/add_site", {
                name: this.name,
                url: this.url
            }).then(response => {
                console.log(`Site added`)
            })
            this.fetchAllSites()
            this.name = this.url = ""
        },
        fetchSite() {
            for (let k in this.datas) {
                axios.post(now_path + "api/get_data", {
                    name: this.datas[k].name
                }).then(response => {
                    this.datas[k].data = response.data
                })
            }
        },
        fetchAllSites() {
            axios.post(now_path + "api/get_sites").then(response => {
                this.datas = response.data
            })
        },
        deleteSite(e) {
            axios.post(now_path + "api/del_site", {
                name: e.srcElement.getAttribute("target")
            }).then(response => {
                console.log("Delete Success")
            })
            this.fetchAllSites()
        }
    },
    mounted() {
        this.fetchAllSites()
        setInterval(drawAllCanvas, 500)
        setInterval(this.fetchSite, 1000)
    }
}

// init
const vm = Vue.createApp(App).mount(".app")
