//https://github.com/dj0001/Motion-Photo-Viewer
(function(){
    var vid=document.createElement("video"), i=0, b;
    vid.style = 'height:100vh; object-fit:scale-down; scroll-snap-align:start';
    vid.controls=false;
    vid.autoplay=true;
    if ('mediaSession' in navigator) navigator.mediaSession.setActionHandler('nexttrack', vid.onended);

    function handleMotionPhoto(img) {
        let container = document.createElement("div");
        container.style.position = "relative";
        container.style.width = "100%";
        container.style.height = "auto";
        container.style.boxSizing = "border-box";
        container.style.cursor = "pointer";

        let canvas = document.createElement("canvas");
        canvas.style.width = "80%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        canvas.style.margin = "auto";
        canvas.style.touchAction = "none";

        let liveBadgeCanvas = document.createElement("canvas");
        liveBadgeCanvas.style.position = "absolute";
        liveBadgeCanvas.style.top = "10px";

        let volumeBadgeCanvas = document.createElement("canvas");
        volumeBadgeCanvas.style.position = "absolute";
        volumeBadgeCanvas.style.top = "10px";
        volumeBadgeCanvas.style.cursor = "pointer";
        volumeBadgeCanvas.style.zIndex = "10";

        const visualWidth = 59;
        const visualHeight = 25;
        let isPlaying = false;
        let isMuted = true;
        let playPromise = null;

        const dpr = window.devicePixelRatio || 1;

        liveBadgeCanvas.width = visualWidth * dpr;
        liveBadgeCanvas.height = visualHeight * dpr;
        liveBadgeCanvas.style.width = `${visualWidth}px`;
        liveBadgeCanvas.style.height = `${visualHeight}px`;

        const volumeVisualSize = visualHeight;
        volumeBadgeCanvas.width = volumeVisualSize * dpr;
        volumeBadgeCanvas.height = volumeVisualSize * dpr;
        volumeBadgeCanvas.style.width = `${volumeVisualSize}px`;
        volumeBadgeCanvas.style.height = `${volumeVisualSize}px`;

        let imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = img.src;

        let v = document.createElement("video");
        v.style.position = "absolute";
        v.style.width = "1px";
        v.style.height = "1px";
        v.style.opacity = "0";
        v.style.pointerEvents = "none";
        v.style.touchAction = "none";
        v.style.zIndex = "-1000";
        v.setAttribute("webkit-playsinline", "true");
        v.setAttribute("playsinline", "true");
        v.setAttribute("muted", "true");
        v.muted = true;
        v.volume = 0;
        v.autoplay = false;
        v.controls = false;

        imgObj.onload = function() {
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;

            let ctx = canvas.getContext('2d', { alpha: false });
            ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);

            const containerWidth = container.offsetWidth;
            const marginSide = containerWidth * 0.1;

            liveBadgeCanvas.style.left = `${marginSide + 10}px`;

            const volumeLeft = marginSide + 10 + visualWidth + 5;
            volumeBadgeCanvas.style.left = `${volumeLeft}px`;

            drawLiveBadge(false);
            drawVolumeBadge(isMuted);

            imgtoblob(img.src).then(blob => {
                if (blob) {
                    v.src = blob;

                    v.addEventListener('loadedmetadata', function() {
                        function updateCanvas() {
                            if (isPlaying && !v.paused && !v.ended) {
                                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                                requestAnimationFrame(updateCanvas);
                            }
                        }

                        v.addEventListener('play', function() {
                            isPlaying = true;
                            updateCanvas();
                            updateLiveBadgeAnimation();
                        });

                        v.addEventListener('pause', function() {
                            isPlaying = false;
                            if (!container.matches(':hover')) {
                                resetCanvas();
                                drawLiveBadge(false);
                            }
                        });

                        v.addEventListener('ended', function() {
                            isPlaying = false;
                            resetCanvas();
                            v.currentTime = 0;
                            drawLiveBadge(false);
                        });

                        function resetCanvas() {
                            ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
                        }
                    });
                }
            });
        };

        let liveBadgeAnimationId = null;

        function updateLiveBadgeAnimation() {
            if (liveBadgeAnimationId) {
                cancelAnimationFrame(liveBadgeAnimationId);
            }

            function animate() {
                if (isPlaying) {
                    drawLiveBadge(true);
                    liveBadgeAnimationId = requestAnimationFrame(animate);
                }
            }

            animate();
        }

        function drawLiveBadge(active) {
            const badgeCtx = liveBadgeCanvas.getContext('2d', { alpha: true });
            badgeCtx.clearRect(0, 0, liveBadgeCanvas.width, liveBadgeCanvas.height);
            badgeCtx.save();
            badgeCtx.scale(dpr, dpr);

            const badgeWidth = visualWidth;
            const badgeHeight = visualHeight;

            badgeCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
            roundRect(badgeCtx, 0, 0, badgeWidth, badgeHeight, 5, 1);

            const iconWidth = badgeHeight * 0.85;
            const textWidth = badgeWidth - iconWidth;
            const circleX = iconWidth / 1.5;
            const circleY = badgeHeight / 2;
            const circleRadius = iconWidth * 0.3;

            badgeCtx.strokeStyle = "rgba(0, 0, 0, 1)";
            badgeCtx.lineWidth = badgeHeight * 0.04;
            badgeCtx.lineCap = "round";

            const dashSize = circleRadius * 0.35;
            const dashGap = circleRadius * 0.25;
            badgeCtx.setLineDash([dashSize, dashGap]);

            if (active) {
                const timestamp = Date.now() / 1000;
                // 脉动效果：半径在 0-1 之间周期变化
                const animationOffset = Math.sin(timestamp * 5) * 0.5 + 0.5;
                const pulseSize = circleRadius * 0.15;

                // 旋转效果
                //const rotation = (timestamp * Math.PI * 2) % (Math.PI * 2);
                const rotation =Math.sin(timestamp * 2) * (Math.PI / 8);
                
                badgeCtx.save();
                badgeCtx.translate(circleX, circleY);
                badgeCtx.rotate(rotation);
                badgeCtx.beginPath();
                // 结合脉动和旋转
                const radius = circleRadius + animationOffset * pulseSize;
                badgeCtx.arc(0, 0, radius, 0, Math.PI * 2);
                badgeCtx.stroke();
                badgeCtx.restore();
            } else {
                badgeCtx.beginPath();
                badgeCtx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
                badgeCtx.stroke();
            }

            badgeCtx.setLineDash([]);

            const triangleSize = circleRadius * 0.95;

            badgeCtx.beginPath();
            badgeCtx.moveTo(circleX - triangleSize * 0.3, circleY - triangleSize * 0.35);
            badgeCtx.lineTo(circleX + triangleSize * 0.45, circleY);
            badgeCtx.lineTo(circleX - triangleSize * 0.3, circleY + triangleSize * 0.35);
            badgeCtx.closePath();
            badgeCtx.fillStyle = "rgba(0, 0, 0, 1)";
            badgeCtx.fill();

            const fontSize = Math.floor(badgeHeight * 0.5);
            badgeCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
            badgeCtx.fillStyle = "rgba(0, 0, 0, 1)";
            badgeCtx.textAlign = "center";
            badgeCtx.textBaseline = "middle";

            const textX = iconWidth + textWidth * 0.45;
            const textY = badgeHeight / 2 + 1;
            badgeCtx.fillText("LIVE", textX, textY);

            badgeCtx.restore();
        }

        function drawVolumeBadge(muted) {
            const badgeCtx = volumeBadgeCanvas.getContext('2d', { alpha: true });
            badgeCtx.clearRect(0, 0, volumeBadgeCanvas.width, volumeBadgeCanvas.height);
            badgeCtx.save();
            badgeCtx.scale(dpr, dpr);

            const badgeSize = volumeVisualSize;

            badgeCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
            roundRect(badgeCtx, 0, 0, badgeSize, badgeSize, 5, 1);

            const iconWidth = badgeSize * 0.85;
            const centerX = badgeSize / 2;
            const centerY = badgeSize / 2;
            const iconSize = iconWidth * 0.6;

            badgeCtx.strokeStyle = "rgba(0, 0, 0, 1)";
            badgeCtx.fillStyle = "rgba(0, 0, 0, 1)";
            badgeCtx.lineWidth = badgeSize * 0.04;
            badgeCtx.lineCap = "round";
            badgeCtx.lineJoin = "round";

            const scale = iconSize / 24;

            badgeCtx.save();
            badgeCtx.translate(centerX - iconSize / 2, centerY - iconSize / 2);
            badgeCtx.scale(scale, scale);

            if (muted) {
                const speakerPath = new Path2D("M 11.60 2.08 L 11.48 2.14 L 3.91 6.68 C 3.02 7.21 2.28 7.97 1.77 8.87 C 1.26 9.77 1.00 10.79 1 11.83 V 12.16 L 1.01 12.56 C 1.07 13.52 1.37 14.46 1.87 15.29 C 2.38 16.12 3.08 16.81 3.91 17.31 L 11.48 21.85 C 11.63 21.94 11.80 21.99 11.98 21.99 C 12.16 22.00 12.33 21.95 12.49 21.87 C 12.64 21.78 12.77 21.65 12.86 21.50 C 12.95 21.35 13 21.17 13 21 V 3 C 12.99 2.83 12.95 2.67 12.87 2.52 C 12.80 2.37 12.68 2.25 12.54 2.16 C 12.41 2.07 12.25 2.01 12.08 2.00 C 11.92 1.98 11.75 2.01 11.60 2.08 Z");
                badgeCtx.stroke(speakerPath);

                badgeCtx.lineWidth = 2.5;
                badgeCtx.beginPath();
                badgeCtx.moveTo(16, 9);
                badgeCtx.lineTo(22, 15);
                badgeCtx.moveTo(22, 9);
                badgeCtx.lineTo(16, 15);
                badgeCtx.stroke();

            } else {
                const speakerPath = new Path2D("M 11.60 2.08 L 11.48 2.14 L 3.91 6.68 C 3.02 7.21 2.28 7.97 1.77 8.87 C 1.26 9.77 1.00 10.79 1 11.83 V 12.16 L 1.01 12.56 C 1.07 13.52 1.37 14.46 1.87 15.29 C 2.38 16.12 3.08 16.81 3.91 17.31 L 11.48 21.85 C 11.63 21.94 11.80 21.99 11.98 21.99 C 12.16 22.00 12.33 21.95 12.49 21.87 C 12.64 21.78 12.77 21.65 12.86 21.50 C 12.95 21.35 13 21.17 13 21 V 3 C 12.99 2.83 12.95 2.67 12.87 2.52 C 12.80 2.37 12.68 2.25 12.54 2.16 C 12.41 2.07 12.25 2.01 12.08 2.00 C 11.92 1.98 11.75 2.01 11.60 2.08 Z");
                badgeCtx.fill(speakerPath);

                badgeCtx.lineWidth = 2;

                const smallRipple = new Path2D("M 15.53 7.05 C 15.35 7.22 15.25 7.45 15.24 7.70 C 15.23 7.95 15.31 8.19 15.46 8.38 L 15.53 8.46 L 15.70 8.64 C 16.09 9.06 16.39 9.55 16.61 10.08 L 16.70 10.31 C 16.90 10.85 17 11.42 17 12 L 16.99 12.24 C 16.96 12.73 16.87 13.22 16.70 13.68 L 16.61 13.91 C 16.36 14.51 15.99 15.07 15.53 15.53 C 15.35 15.72 15.25 15.97 15.26 16.23 C 15.26 16.49 15.37 16.74 15.55 16.92 C 15.73 17.11 15.98 17.21 16.24 17.22 C 16.50 17.22 16.76 17.12 16.95 16.95 C 17.6 16.29 18.11 15.52 18.46 14.67 L 18.59 14.35 C 18.82 13.71 18.95 13.03 18.99 12.34 L 19 12 C 18.99 11.19 18.86 10.39 18.59 9.64 L 18.46 9.32 C 18.15 8.57 17.72 7.89 17.18 7.3 L 16.95 7.05 L 16.87 6.98 C 16.68 6.82 16.43 6.74 16.19 6.75 C 15.94 6.77 15.71 6.87 15.53 7.05");
                badgeCtx.fill(smallRipple);

                const bigRipple = new Path2D("M18.36 4.22C18.18 4.39 18.08 4.62 18.07 4.87C18.05 5.12 18.13 5.36 18.29 5.56L18.36 5.63L18.66 5.95C19.36 6.72 19.91 7.60 20.31 8.55L20.47 8.96C20.82 9.94 21 10.96 21 11.99L20.98 12.44C20.94 13.32 20.77 14.19 20.47 15.03L20.31 15.44C19.86 16.53 19.19 17.52 18.36 18.36C18.17 18.55 18.07 18.80 18.07 19.07C18.07 19.33 18.17 19.59 18.36 19.77C18.55 19.96 18.80 20.07 19.07 20.07C19.33 20.07 19.59 19.96 19.77 19.77C20.79 18.75 21.61 17.54 22.16 16.20L22.35 15.70C22.72 14.68 22.93 13.62 22.98 12.54L23 12C22.99 10.73 22.78 9.48 22.35 8.29L22.16 7.79C21.67 6.62 20.99 5.54 20.15 4.61L19.77 4.22L19.70 4.15C19.51 3.99 19.26 3.91 19.02 3.93C18.77 3.94 18.53 4.04 18.36 4.22 Z");
                badgeCtx.fill(bigRipple);
            }

            badgeCtx.restore();
            badgeCtx.restore();
        }

        function roundRect(ctx, x, y, width, height, radius, scale) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }

        volumeBadgeCanvas.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            isMuted = !isMuted;
            v.muted = isMuted;

            if (!isMuted) {
                v.volume = 1;
            }

            drawVolumeBadge(isMuted);
        });

        function startPlayback() {
            v.currentTime = 0;

            if (playPromise !== null) {
                playPromise.catch(() => {}).then(() => {
                    playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            isPlaying = true;
                        }).catch(() => {
                            v.muted = true;
                            playPromise = v.play();
                        });
                    }
                });
            } else {
                playPromise = v.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        isPlaying = true;
                    }).catch(() => {
                        v.muted = true;
                        playPromise = v.play();
                    });
                }
            }
        }

        function stopPlayback() {
            if (playPromise !== null) {
                playPromise.catch(() => {}).then(() => {
                    v.pause();
                    v.currentTime = 0;
                    isPlaying = false;
                    playPromise = null;

                    if (liveBadgeAnimationId) {
                        cancelAnimationFrame(liveBadgeAnimationId);
                        liveBadgeAnimationId = null;
                    }

                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
                    drawLiveBadge(false);
                });
            } else {
                v.pause();
                v.currentTime = 0;
                isPlaying = false;

                if (liveBadgeAnimationId) {
                    cancelAnimationFrame(liveBadgeAnimationId);
                    liveBadgeAnimationId = null;
                }

                let ctx = canvas.getContext('2d');
                ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
                drawLiveBadge(false);
            }
        }

        container.addEventListener('mouseenter', function() {
            startPlayback();
        });

        container.addEventListener('mouseleave', function() {
            stopPlayback();
        });

        let touchStartTime = 0;
        let isTouching = false;

        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            touchStartTime = Date.now();
            isTouching = true;

            if (!isPlaying) {
                startPlayback();
            } else {
                stopPlayback();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', function(e) {
            e.preventDefault();

            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 300) {
            } else {
                if (isTouching) {
                    stopPlayback();
                }
            }

            isTouching = false;
        }, { passive: false });

        container.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!isPlaying) {
                startPlayback();
            } else {
                stopPlayback();
            }
        });

        container.appendChild(canvas);
        container.appendChild(liveBadgeCanvas);
        container.appendChild(volumeBadgeCanvas);
        document.body.appendChild(v);

        img.parentNode.insertBefore(container, img);
        img.parentNode.removeChild(img);

        document.addEventListener('visibilitychange', function() {
            if (document.hidden && isPlaying) {
                stopPlayback();
            }
        });

        window.addEventListener('resize', function() {
            if (container) {
                const containerWidth = container.offsetWidth;
                const marginSide = containerWidth * 0.1;
                liveBadgeCanvas.style.left = `${marginSide + 10}px`;
                const volumeLeft = marginSide + 10 + visualWidth + 5;
                volumeBadgeCanvas.style.left = `${volumeLeft}px`;
            }
        });
    }

    function initializeMotionPhotos() {
        const motionContainers = document.querySelectorAll('#files');
        motionContainers.forEach(container => {
            const images = container.querySelectorAll('img');
            images.forEach(img => {
                handleMotionPhoto(img);
            });
        });
    }

    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeMotionPhotos, 500);
    });

    (document.querySelector('#files')||document.body).addEventListener('click', function(event){
        if(event.target.tagName === 'CANVAS' ||
            (event.target.tagName === 'DIV' && event.target.querySelector('canvas'))) {
            return;
        }

        b=[...document.querySelectorAll('#files img')];
        if(!b.includes(event.target)) return;
        event.preventDefault();
        let img = event.target;

        vid.onended = function(){
            i=(i+1)%b.length;
            vid.src=b[i].href||b[i].src||b[i];
            vid.play();
            vid.title=vid.src
        };
        (document.querySelector('ul')||document.body).append(vid);
        vid.scrollIntoView();
        vid.src=img.href||img.src;
    });

    window.addEventListener('error', (e) => {
        e=e.target;
        if(e.tagName=='VIDEO') {
            imgtoblob(e.src).then(blob => {e.src=blob});
        }
    }, true);

    async function imgtoblob(img,o) {
        let response = await fetch(img);
        let data = await response.arrayBuffer();
        return URL.createObjectURL(buffertoblob(data,o));
    }

    function buffertoblob(data,o) {
        var array=new Uint8Array(data), start;
        for (var i = 0; i < array.length; i++) {
            if (array[i+4]==0x66 && array[i+5]==0x74 && array[i+6]==0x79 && array[i+7]==0x70) {
                start=i;
                break;
            }
        }
        if(start==undefined) {
            vid.poster=vid.src;
            return false;
        }
        var blob= o? new Blob([array.subarray(0,start)],{type:"image/jpg"}) : new Blob([array.subarray(start,array.length)],{type:"video/mp4"});
        return blob;
    }

    const ls=location.search;
    if(ls.startsWith("?MV=")) {
        vid.loop=true;
        document.body.append(vid);
        imgtoblob(ls.slice(4)).then(blob => vid.src=blob);
    }

    const inp=document.querySelector('label>input[type=file]');
    if(inp) {
        inp.onchange= function(){
            document.body.append(vid);
            vid.src=URL.createObjectURL(inp.files[0]);
        }
        vid.onended= function(){
            let r=1;
            i=(i+1)%(inp.files.length*r);
            if(!((i/r)%1)) {
                r=Math.floor(i/r);
                vid.src=URL.createObjectURL(inp.files[r]);
                vid.title=inp.files[r].name+'.mp4';
            };
            vid.play();
        };
        var d=document.createElement("a");
        document.body.appendChild(d);
        vid.onclick= () => {
            if(!vid.controls) {
                imgtoblob(URL.createObjectURL(inp.files[i]),1).then(blob => {
                    d.download=inp.files[i].name;
                    d.href=URL.createObjectURL(blob);
                    d.click();
                });
            }
        };
    }
})();

