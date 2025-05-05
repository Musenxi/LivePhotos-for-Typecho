//https://github.com/dj0001/Motion-Photo-Viewer
(function(){
  var vid=document.createElement("video"), i=0, b;
    vid.style = 'height:100vh; object-fit:scale-down; scroll-snap-align:start';
    vid.controls=false; // 移除全局控件
    vid.autoplay=true;
    if ('mediaSession' in navigator) navigator.mediaSession.setActionHandler('nexttrack', vid.onended);  //>5sec
  
  // 处理Motion图的函数
  function handleMotionPhoto(img) {
    // 创建包装容器
    let container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "auto";
    container.style.boxSizing = "border-box"; // 确保 padding 不会增加总宽度
    container.style.cursor = "pointer";
    
    // 创建 Canvas 元素替代图片和视频
    let canvas = document.createElement("canvas");
    canvas.style.width = "80%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    canvas.style.margin = "auto";
    canvas.style.touchAction = "none"; // 阻止浏览器默认触摸行为
    
    // 创建独立的 LIVE 标识 Canvas
    let liveBadgeCanvas = document.createElement("canvas");
    liveBadgeCanvas.style.position = "absolute";
    liveBadgeCanvas.style.top = "10px"; // 距离顶部10px
    
    // 标识相关参数 - 调整为精确尺寸
    const visualWidth = 59; // 标识宽度
    const visualHeight = 25; // 标识高度
    let isPlaying = false; // 跟踪播放状态
    
    // 设置 LIVE 标识 Canvas 尺寸 - 增加分辨率提高清晰度
    const dpr = window.devicePixelRatio || 1; // 获取设备像素比
    
    // Canvas尺寸直接设置为本体大小
    liveBadgeCanvas.width = visualWidth * dpr;
    liveBadgeCanvas.height = visualHeight * dpr;
    
    // 设置样式尺寸保持视觉大小
    liveBadgeCanvas.style.width = `${visualWidth}px`;
    liveBadgeCanvas.style.height = `${visualHeight}px`;
    
    // 获取图片原始尺寸以设置 Canvas 尺寸
    let imgObj = new Image();
    imgObj.crossOrigin = "anonymous";
    imgObj.src = img.src;
    
    // 创建隐藏的视频元素用于播放
    let v = document.createElement("video");
    // 彻底隐藏视频元素，防止任何交互
    v.style.position = "absolute";
    v.style.width = "1px";
    v.style.height = "1px";
    v.style.opacity = "0";
    v.style.pointerEvents = "none"; // 禁止鼠标事件
    v.style.touchAction = "none"; // 禁止触摸事件
    v.style.zIndex = "-1000"; // 放在最底层
    v.setAttribute("webkit-playsinline", "true"); // iOS Safari 支持
    v.setAttribute("playsinline", "true");
    v.setAttribute("muted", "true");
    v.muted = true;
    v.volume = 0;
    v.autoplay = false;
    v.controls = false;
    
    // 等待图片加载完成
    imgObj.onload = function() {
      // 设置主 Canvas 尺寸
      canvas.width = imgObj.width;
      canvas.height = imgObj.height;
      
      // 初始绘制图片到主 Canvas
      let ctx = canvas.getContext('2d', { alpha: false }); // 使用不透明 canvas 提高性能
      ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
      
      // 计算 LIVE 标识的位置
      const containerWidth = container.offsetWidth;
      const marginSide = containerWidth * 0.1; // 每侧 5% 的边距
      
      // 设置 LIVE 标识位置为左侧边距 + 10px
      liveBadgeCanvas.style.left = `${marginSide + 10}px`;
      
      // 立即绘制静态状态的 LIVE 标识
      drawLiveBadge(false);
      
      // 加载并准备视频
      imgtoblob(img.src).then(blob => {
        if (blob) {
          v.src = blob;
          
          // 视频加载完成后设置事件处理
          v.addEventListener('loadedmetadata', function() {
            // 视频帧更新函数
            function updateCanvas() {
              if (isPlaying && !v.paused && !v.ended) {
                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(updateCanvas);
              }
            }
            
            // 视频播放时开始绘制帧
            v.addEventListener('play', function() {
              isPlaying = true;
              updateCanvas();
              // 更新 LIVE 标识为动态状态
              updateLiveBadgeAnimation();
            });
            
            // 视频暂停或结束时重置
            v.addEventListener('pause', function() {
              isPlaying = false;
              if (!container.matches(':hover')) {
                resetCanvas();
                drawLiveBadge(false); // 重置为静态标识
              }
            });
            
            // 视频结束时重置
            v.addEventListener('ended', function() {
              isPlaying = false;
              resetCanvas();
              v.currentTime = 0;
              drawLiveBadge(false); // 重置为静态标识
            });
            
            // 重置 Canvas 到初始状态
            function resetCanvas() {
              ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
            }
          });
        }
      });
    };
    
    // LIVE 标识动画的 requestAnimationFrame ID
    let liveBadgeAnimationId = null;
    
    // 更新 LIVE 标识动画
    function updateLiveBadgeAnimation() {
      // 如果已经有动画在运行，先取消
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

  // 绘制 LIVE 标识函数
  function drawLiveBadge(active) {
    const badgeCtx = liveBadgeCanvas.getContext('2d', { alpha: true });
    // 清除之前的绘制内容
    badgeCtx.clearRect(0, 0, liveBadgeCanvas.width, liveBadgeCanvas.height);
    
    // 应用设备像素比例提高清晰度
    badgeCtx.scale(dpr, dpr);
    
    // 直接使用本体尺寸，无需额外内边距
    const badgeWidth = visualWidth;
    const badgeHeight = visualHeight;
    
    // 绘制白色半透明圆角矩形背景
    badgeCtx.fillStyle = "rgba(255, 255, 255)";
    roundRect(badgeCtx, 0, 0, badgeWidth, badgeHeight, 5, 1);

    // 更紧凑的图标和文本布局 - 调整元素比例
    const iconWidth = badgeHeight * 0.85; // 图标部分宽度
    const textWidth = badgeWidth - iconWidth; // 文本部分宽度
    
    // 计算圆环位置 - 更加靠左
    const circleX = iconWidth / 1.5;
    const circleY = badgeHeight / 2;
    const circleRadius = iconWidth * 0.3; // 减小圆环半径
    
    // 绘制虚线圆环 - 应用抗锯齿，更细的线条
    badgeCtx.strokeStyle = "rgba(0, 0, 0, 1)";
    badgeCtx.lineWidth = badgeHeight * 0.04; // 减小线宽
    badgeCtx.lineCap = "round"; // 使线条端点圆滑
    
    // 根据圆环大小调整虚线参数 - 更小的虚线
    const dashSize = circleRadius * 0.35;
    const dashGap = circleRadius * 0.25;
    badgeCtx.setLineDash([dashSize, dashGap]);
    
    // 根据激活状态绘制圆环
    if (active) {
      // 计算动画位置
      const timestamp = Date.now() / 1000;
      const animationOffset = Math.sin(timestamp * 5) * 0.5 + 0.5; // 0-1之间浮动
      const pulseSize = circleRadius * 0.15; // 减小脉动效果

      badgeCtx.beginPath();
      const radius = circleRadius + animationOffset * pulseSize;
      badgeCtx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      badgeCtx.stroke();
    } else {
      // 静态圆环
      badgeCtx.beginPath();
      badgeCtx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
      badgeCtx.stroke();
    }
    
    badgeCtx.setLineDash([]); // 重置回实线

    // 三角形大小 - 减小三角形大小
    const triangleSize = circleRadius * 0.95;
    
    // 绘制播放按钮三角形 - 更紧凑地放在圆环内
    badgeCtx.beginPath();
    badgeCtx.moveTo(circleX - triangleSize * 0.3, circleY - triangleSize * 0.35);
    badgeCtx.lineTo(circleX + triangleSize * 0.45, circleY);
    badgeCtx.lineTo(circleX - triangleSize * 0.3, circleY + triangleSize * 0.35);
    badgeCtx.closePath();
    badgeCtx.fillStyle = "rgba(0, 0, 0, 1)";
    badgeCtx.fill();

    // 绘制 LIVE 文本 - 字体更小，位置更靠左
    const fontSize = Math.floor(badgeHeight * 0.5); // 减小字体大小
    badgeCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    badgeCtx.fillStyle = "rgba(0, 0, 0, 1)";
    badgeCtx.textAlign = "center";
    badgeCtx.textBaseline = "middle";
    
    // 文本位置 - 靠近图标区域
    const textX = iconWidth + textWidth * 0.45; // 文本左移
    const textY = badgeHeight / 2 + 1; // 轻微下移1px以视觉居中
    badgeCtx.fillText("LIVE", textX, textY);
    
    // 重置比例变换，为下次绘制做准备
    badgeCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
    
    // 保留原有的 roundRect 函数
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
    
    // 开始播放函数
    function startPlayback() {
      v.currentTime = 0;
      
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
          })
          .catch(error => {
            console.log("播放出错:", error);
            v.muted = true;
            v.play();
          });
      }
    }
    
    // 停止播放函数
    function stopPlayback() {
      v.pause();
      v.currentTime = 0;
      isPlaying = false;
      
      // 取消 LIVE 标识动画
      if (liveBadgeAnimationId) {
        cancelAnimationFrame(liveBadgeAnimationId);
        liveBadgeAnimationId = null;
      }
      
      // 重绘初始图片
      let ctx = canvas.getContext('2d');
      ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
      // 重绘静态状态的标识
      drawLiveBadge(false);
    }
    
    // 鼠标悬停事件 - 桌面设备
    container.addEventListener('mouseenter', function() {
      startPlayback();
    });
    
    container.addEventListener('mouseleave', function() {
      stopPlayback();
    });
    
    // 处理移动设备触摸事件
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
        // 已在touchstart中处理
      } else {
        if (isTouching) {
          stopPlayback();
        }
      }
      
      isTouching = false;
    }, { passive: false });
    
    // 点击事件
    container.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isPlaying) {
        startPlayback();
      } else {
        stopPlayback();
      }
    });
    
    // 将元素添加到容器
    container.appendChild(canvas);
    container.appendChild(liveBadgeCanvas);
    document.body.appendChild(v);
    
    // 替换原始图片
    img.parentNode.insertBefore(container, img);
    img.parentNode.removeChild(img);
    
    // 当页面不可见时暂停视频播放
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && isPlaying) {
        stopPlayback();
      }
    });
    
    // 在窗口大小变化时重新计算位置
    window.addEventListener('resize', function() {
      if (container) {
        const containerWidth = container.offsetWidth;
        const marginSide = containerWidth * 0.1; // 每侧 5% 的边距
        liveBadgeCanvas.style.left = `${marginSide + 10}px`;
      }
    });
  }

  // 初始化Motion图
  function initializeMotionPhotos() {
    const motionContainers = document.querySelectorAll('#files');
    motionContainers.forEach(container => {
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        handleMotionPhoto(img);
      });
    });
  }
  
  // 页面加载完成后初始化Motion图
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeMotionPhotos, 500); // 延迟一点执行，确保DOM已完全加载
  });
  
  // 监听文件容器的点击事件 - 保留原有功能，但不处理Motion图
  (document.querySelector('#files')||document.body).addEventListener('click', function(event){
    // 如果点击的是我们处理过的Motion图，不执行原有逻辑
    if(event.target.tagName === 'CANVAS' || 
       (event.target.tagName === 'DIV' && event.target.querySelector('canvas'))) {
      return;
    }
    
    b=[...document.querySelectorAll('#files img')];
    if(!b.includes(event.target)) return;
    event.preventDefault();
    let img = event.target;
    
    // 原有的视频处理逻辑
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
  
  /* 处理错误的视频 */
  window.addEventListener('error', (e) => {
    e=e.target; 
    if(e.tagName=='VIDEO') {
      imgtoblob(e.src).then(blob => {e.src=blob});
    }
  }, true);
  
  /* 从图片提取视频数据 */
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
    }  //ftyp
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
  
  /* 文件输入处理 */
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