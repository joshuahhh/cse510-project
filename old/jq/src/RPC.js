"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCallee = exports.RPCaller = void 0;
class RPCaller {
    constructor(frameOrUrl) {
        this.seqNum = 0;
        this.callbacks = {};
        if (typeof frameOrUrl === 'string') {
            this.frame = document.createElement('iframe');
            this.frame.src = frameOrUrl;
            this.frame.style.cssText = "width: 0; height: 0; border: 0; border: none; position: absolute;";
            document.body.appendChild(this.frame);
        }
        else {
            this.frame = frameOrUrl;
        }
        this.ready = (async () => {
            await new Promise((resolve) => {
                this.frame.addEventListener('load', resolve);
            });
            // TODO: handshake
        })();
        window.addEventListener('message', (ev) => {
            if (!ev.data || typeof ev.data !== 'object')
                return;
            const seqNum = ev.data.seqNum;
            const callback = this.callbacks[seqNum];
            if (ev.data.error) {
                callback.reject(ev.data.error);
            }
            else {
                callback.resolve(ev.data.result);
            }
            delete this.callbacks[ev.data.seqNum];
        });
    }
    async call(args) {
        await this.ready;
        let seqNum = this.seqNum;
        this.seqNum++;
        this.frame.contentWindow.postMessage({ seqNum, args }, "*");
        return await new Promise((resolve, reject) => this.callbacks[seqNum] = { resolve, reject });
    }
}
exports.RPCaller = RPCaller;
async function exampleCaller() {
    let rpc = new RPCaller(document.getElementById("iframe"));
    await rpc.ready;
    const sum1 = await rpc.call([10, 20]);
    document.getElementById("pre").innerHTML += `10 + 20 = ${sum1}\n`;
    const sum2 = await rpc.call([sum1, sum1]);
    document.getElementById("pre").innerHTML += `${sum1} + ${sum1} = ${sum2}\n`;
}
async function exampleCallee() {
    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    let rpc = new RPCallee(async ([a, b]) => {
        wait(1000);
        return a + b;
    });
}
class RPCallee {
    constructor(handler) {
        window.addEventListener('message', async (ev) => {
            if (!ev.data || typeof ev.data !== 'object')
                return;
            const { seqNum, args } = ev.data;
            try {
                const result = await handler(args);
                window.parent.postMessage({ seqNum, result }, "*");
            }
            catch (error) {
                window.parent.postMessage({ seqNum, error }, "*");
            }
        });
    }
}
exports.RPCallee = RPCallee;
//# sourceMappingURL=RPC.js.map