class KegelTrainer {
    constructor() {
        this.totalDuration = 3 * 60; // 3分钟，单位：秒
        this.contractDuration = 3; // 收缩阶段3秒
        this.relaxDuration = 3; // 放松阶段3秒
        this.cycleDuration = this.contractDuration + this.relaxDuration; // 一个完整周期6秒
        
        this.currentTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        
        this.initializeElements();
        this.initializeSpeech();
        this.bindEvents();
    }
    
    initializeElements() {
        this.currentActionEl = document.getElementById('currentAction');
        this.timerEl = document.getElementById('timer');
        this.progressBarEl = document.getElementById('progressBar');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.voiceSelect = document.getElementById('voiceSelect');
    }
    
    initializeSpeech() {
        // 等待语音列表加载
        if (this.speechSynthesis.onvoiceschanged !== undefined) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
        
        // 立即尝试加载语音
        this.loadVoices();
    }
    
    loadVoices() {
        this.voices = this.speechSynthesis.getVoices();
        
        // 清空选择框
        this.voiceSelect.innerHTML = '<option value="">自动选择</option>';
        
        // 添加中文语音选项
        this.voices.forEach((voice, index) => {
            if (voice.lang.includes('zh') || voice.lang.includes('cmn')) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            }
        });
        
        // 如果没有找到中文语音，添加所有可用语音
        if (this.voiceSelect.children.length <= 1) {
            this.voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });
        }
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTraining());
        this.pauseBtn.addEventListener('click', () => this.pauseTraining());
        this.resetBtn.addEventListener('click', () => this.resetTraining());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        this.voiceSelect.addEventListener('change', (e) => this.updateVoice(e.target.value));
    }
    
    startTraining() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            
            // 如果是从暂停状态恢复，不重置时间
            if (this.currentTime === 0) {
                this.speak('开始训练');
            }
            
            this.interval = setInterval(() => {
                this.updateTraining();
            }, 1000);
        }
    }
    
    pauseTraining() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.startBtn.disabled = false;
            this.pauseBtn.textContent = '继续';
            this.speak('训练暂停');
            clearInterval(this.interval);
        } else if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.textContent = '暂停';
            this.speak('继续训练');
            this.interval = setInterval(() => {
                this.updateTraining();
            }, 1000);
        }
    }
    
    resetTraining() {
        this.stopTraining();
        this.currentTime = 0;
        this.updateDisplay();
        this.currentActionEl.textContent = '准备开始';
        this.currentActionEl.className = 'current-action';
    }
    
    stopTraining() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        clearInterval(this.interval);
    }
    
    updateTraining() {
        this.currentTime++;
        
        if (this.currentTime >= this.totalDuration) {
            this.completeTraining();
            return;
        }
        
        this.updateDisplay();
        this.updateAction();
    }
    
    updateDisplay() {
        const remainingTime = this.totalDuration - this.currentTime;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = (this.currentTime / this.totalDuration) * 100;
        this.progressBarEl.style.width = `${progress}%`;
    }
    
    updateAction() {
        const cycleTime = this.currentTime % this.cycleDuration;
        
        if (cycleTime === 0) {
            // 开始新的收缩周期
            this.currentActionEl.textContent = '收缩并保持';
            this.currentActionEl.className = 'current-action contracting';
            this.speak('收缩并保持');
        } else if (cycleTime === this.contractDuration) {
            // 开始放松阶段
            this.currentActionEl.textContent = '放松';
            this.currentActionEl.className = 'current-action relaxing';
            this.speak('放松');
        }
    }
    
    completeTraining() {
        this.stopTraining();
        this.currentActionEl.textContent = '训练完成！';
        this.currentActionEl.className = 'current-action';
        this.speak('训练完成，恭喜您！');
    }
    
    speak(text) {
        // 停止当前正在播放的语音
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = parseFloat(this.volumeSlider.value);
        utterance.rate = 0.8; // 稍微慢一点，让用户更容易听清
        
        // 设置语音
        const selectedVoiceIndex = this.voiceSelect.value;
        if (selectedVoiceIndex !== '') {
            utterance.voice = this.voices[parseInt(selectedVoiceIndex)];
        } else {
            // 自动选择中文语音
            const chineseVoice = this.voices.find(voice => 
                voice.lang.includes('zh') || voice.lang.includes('cmn')
            );
            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }
        }
        
        // 设置语言
        utterance.lang = 'zh-CN';
        
        this.speechSynthesis.speak(utterance);
    }
    
    updateVolume(value) {
        this.volumeValue.textContent = `${Math.round(value * 100)}%`;
    }
    
    updateVoice(voiceIndex) {
        // 语音选择改变时的处理
        console.log('语音已更改为:', voiceIndex);
    }
}

// 页面加载完成后初始化训练器
document.addEventListener('DOMContentLoaded', () => {
    new KegelTrainer();
});

// 页面可见性改变时的处理（当用户切换标签页时）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面不可见时，可以暂停语音或显示通知
        console.log('页面不可见，训练继续在后台运行');
    }
});

// 防止页面意外关闭时的确认
window.addEventListener('beforeunload', (e) => {
    // 如果训练正在进行中，询问用户是否确定要离开
    if (window.kegelTrainer && window.kegelTrainer.isRunning) {
        e.preventDefault();
        e.returnValue = '训练正在进行中，确定要离开吗？';
        return e.returnValue;
    }
}); 
