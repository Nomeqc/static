function DingtalkImageUploader(img_base64, callback, progressCallback, errorCallback) {
    this.upload = function() {
        const socket = new WebSocket('wss://webalfa.dingtalk.com/lwp')
        // 打开socket
        socket.onopen = (event)=>{
            let Tools = function() {
                let i = 0;
                this.genmid = function() {
                    r = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]
                    var e = Math.floor(Math.random() * Math.pow(2, 16))
                      , t = i++
                      , n = "";
                    return n += r[e >> 12 & 15],
                    n += r[e >> 8 & 15],
                    n += r[e >> 4 & 15],
                    n += r[15 & e],
                    n += r[t >> 12 & 15],
                    n += r[t >> 8 & 15],
                    n += r[t >> 4 & 15],
                    n += r[15 & t]
                }
            }

            let Uploader = function() {
                let tool = new Tools();
                let frags = [];
                let offset = 0;
                let frag_size = Math.min(200 * 1000, img_base64.length - offset);
                while (frag_size > 0) {
                    frags.push(img_base64.substring(offset, offset + frag_size));
                    offset += frag_size;
                    frag_size = Math.min(frag_size, img_base64.length - offset);
                }
                let frag_index = 0;
                let total_frag = frags.length;

                let up_resp = '';
                this.frags = frags;
                this.pre = function() {
                    return new Promise((resolve,reject)=>{
                        console.log('pre');
                        let data = `{"lwp":"/up/pre","headers":{"dt":"j","up-req":"-1;-1;0;flag=hd&mi&ori;bizType=im;","up-ver":"2;1","net-type":"wifi","mid":"${tool.genmid()} 0"},"body":null}`;
                        // 发送一个初始化消息
                        socket.send(data)
                        // 服务器有响应数据触发
                        socket.onmessage = (event)=>{
                            let data = JSON.parse(event.data);
                            if (data['code'] + '' != '200') {
                                reject('出错了：' + event.data);
                                socket.close(1000, 'Normal Closure')
                                return
                            }
                            up_resp = data['headers']['up-resp'].split('&')[0];
                            resolve();
                        }
                        // 出错时触发，并且会关闭连接。这时可以根据错误信息进行按需处理
                        socket.onerror = (event)=>{
                            console.log('error')
                            reject('socket error');
                        }
                    }
                    );
                }
                this.upload = function() {
                    let index = frag_index++;
                    let frag = frags[index];
                    return new Promise((resolve,reject)=>{
                        console.log('index:' + index)
                        let msg_id = tool.genmid()
                        let action_uri = index < total_frag - 1 ? '/up/frag' : '/up/ci';
                        let data = `{"lwp":"${action_uri}","headers":{"dt":"b","up-req":"${up_resp};${index};0;flag=hd&mi&ori;bizType=im;","net-type":"wifi","up-ver":"2;1","mid":"${msg_id} 0"},"body":"${frag}"}`;
                        // 发送一个初始化消息
                        socket.send(data)
                        // 服务器有响应数据触发
                        socket.onmessage = (event)=>{
                            let data = JSON.parse(event.data);
                            if (data['code'] + '' != '200') {
                                reject('出错了：' + event.data);
                                socket.close(1000, 'Normal Closure')
                                return
                            }
                            progressCallback(parseFloat(((index + 1)/total_frag).toFixed(2)));
                            if (action_uri == '/up/ci') {
                                uri = data['body']['uri'].replace('@', '')
                                callback(uri);
                                socket.close(1000, 'Normal Closure')
                            }
                            resolve();
                        }
                        // 出错时触发，并且会关闭连接。这时可以根据错误信息进行按需处理
                        socket.onerror = (event)=>{
                            console.log('error')
                            reject('socket error');
                        }

                    }
                    );
                }

            };
            let upload = new Uploader();
            let promise_obj = Promise.resolve().then(upload.pre);
            for (let i in upload.frags) {
                promise_obj = promise_obj.then(upload.upload)
            }
            promise_obj.catch(error=>{
                errorCallback(error);
            }
            );
        }
    }
}