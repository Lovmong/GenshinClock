<!--时钟-->
<template>
  <div class="clock-container">
    <div class="clock-header" @click="handleClose">返回</div>

    <div class="clock-container_wrapper">
      <div class="clock-con_left" />
      <div class="clock-con_right">
        <label class="clock_unit clock_bg" />
        <div class="clock_unit_mask">
          <div class="clock_unit_mask_wrapper">
            <label class="clock_unit_mask_wrapper clock_hbg" />
            <label class="clock_unit_mask_wrapper clock_horoscope03" :style="{ rotate: `${horoscope03}deg` }" />
            <label class="center center_90 clock_horoscope04" :style="{ rotate: `${horoscope04}deg` }" />
            <div class="center center_35">
              <label class="center-clock clock_horoscope05_1" :style="{ rotate: `${horoscope051}deg` }" />
            </div>
            <div class="center center_50">
              <label class="center-clock clock_horoscope05" :style="{ rotate: `${horoscope05}deg` }" />
            </div>
            <div class="center">
              <label class="center-clock clock_horoscope06" />
            </div>
            <div class="center">
              <label class="center-clock clock_horoscope06 clock_horoscope06_1" :style="{ rotate: `${horoscope061}deg` }" />
            </div>
            <label class="timeZone_wrapper clock_TimeZone" />
            <label class="timeZone_wrapper clock_TimeZone clock_TimeZone_1" />
          </div>
        </div>
        <label class="clock_unit clock_dial" />
        <label class="clock_unit star_particles" />
        <label v-show="(270<=time && time <=360) || (time >=0 && time <= 90)" class="noon_state noon" />
        <label v-show="time>=0 && time <= 180" class="sun_state dusk" />
        <label v-show="time>=180 && time <= 360" class="sun_state morning" />
        <label v-show="time>=90 && time <= 270" class="noon_state night" />
        <label class="clock_unit clock_minuteHand" :style="{ rotate: `${minutesAngle}deg` }" />
        <label
          ref="rotatableElement"
          class="clock_unit clock_hourHand"
          :style="{ rotate: `${rotation}deg` }"
          @mousedown.self="startRotate"
          @mousemove.self="rotate"
          @mouseleave.self="stopRotate"
          @mouseup.self="stopRotate"
        />
        <div class="clock-btn" @click="handleStartToEndAngle">确定</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineEmits } from 'vue'
import gsap from 'gsap'

interface posType{
  x:number,
  y:number
}

const emits = defineEmits(['update','close']); // 更新和关闭的emit
const getCurrentAngle = getCurrentTimeAngles(new Date());// 默认角度
const initSection = getInitSection(getCurrentAngle.hoursAngle); // 默认扇区
const time = getCurrentAngle.hoursAngle;
document.documentElement.style.setProperty('--start-angle', `${getCurrentAngle.hoursAngle}deg`); // 获取css变量

const toothedGearRotationSpeed = ref(8); // 齿轮旋转速度
const rotation = ref(getCurrentAngle.hoursAngle); // 旋转角度
const minutesAngle = ref(getCurrentAngle.hoursAngle); // 分钟旋转角度
const startX = ref(0); // 开始X位置
const startY = ref(0); // 开始Y位置
const initRotation = ref(0); // 保存初始位置
const endRotation = ref(0); // 保存结束位置
const maskAngle = ref(-1); // 遮罩位置
const initStartAngle  = ref(Number(getCurrentAngle.hoursAngle)); // 保存初始开始角度
const initMaskAngle  = ref(0); // 保存mask角度
const rotating = ref(false); // 旋转状态
const isChange = ref(false); // 点击确定状态

const movePosArr = ref < Array<any>>([]); // 保存经过的位置
const curPos = ref<posType | null>({ x: 0,y: 0 }); // 当前位置
// const clockwiseArrSection = ref([0,0,0,0]); // 顺时钟扇区
// const anticlockwiseArrSection = ref([0,0,0,0]); // 逆时钟扇区
// const cumulate = ref(0); // 圈数
const step = ref(0); // 经过步数(区分顺、逆时针)
const areaSection = ref(initSection.section); // 当前扇区
const isClock = ref(true); // 是否逆时针
const isRotationAngle = ref(false); // 是否完整一圈
// const isShowTitle = ref(false); // 是否显示提示

const horoscope03 = ref(0);
const horoscope04 = ref(0);
const horoscope05 = ref(0);
const horoscope051 = ref(0);
const horoscope061 = ref(0);

gsap.to(horoscope03,{ value: -360,duration: 40,repeat: -1,ease: 'none' });
gsap.to(horoscope04,{ value: -360,duration: 40,repeat: -1,ease: 'none' });
gsap.to(horoscope05,{ value: 360,duration: 20,repeat: -1,ease: 'none' });
gsap.to(horoscope051,{ value: 360,duration: 30,repeat: -1,ease: 'none' });
gsap.to(horoscope061,{ value: -360,duration: 30,repeat: -1,ease: 'none' });

watch(maskAngle,(value,) => {
  // console.log(cumulate.value)
  // 如果在第四扇区，并且即将跨越到第一扇区，清除一下缓存
  if (areaSection.value === 4 && value > 340){
    clearState()
  }
});
// 计算步数
watch(areaSection,(value,oldValue) => {
  if (value - oldValue > 0){
    step.value++;
  }else {
    step.value--;
  }
  if (value === 1 && oldValue === 4){
    step.value++; // 从第四过渡到第一扇区 ++
  }
  if (value === 4 && oldValue === 1){
    step.value--; // 从第一过渡到第四扇区 --
  }
});

function startRotate(event: MouseEvent):void {
  event.stopPropagation();
  event.preventDefault();
  rotating.value = true;
  // isClock.value = true;

  const target = event.target as HTMLDivElement;
  const elRect = target?.getBoundingClientRect();
  startX.value = elRect.left + elRect.width / 2;
  startY.value = elRect.top + elRect.height / 2;

  initRotation.value = rotation.value;
}

function rotate(event: MouseEvent):void {
  if (!rotating.value) return;
  const deltaX = event.clientX - startX.value;
  const deltaY = event.clientY - startY.value;

  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;

  if (angle < 0) {
    angle += 360;
  }

  calculateSector(event,angle);

  if (step.value < 0){
    return;
  }

  // 在起点，既步数step=0时，不允许逆时针旋转的判断
  if (initSection.section === 4){
    if (step.value <= 0){
      if (angle < time && angle > 180){
        return;
      }
    }
  }
  if (initSection.section === 1){
    if (step.value <= 0){
      if ((angle < time && angle > 0) || (angle > time && angle >= 180)){
        return;
      }
    }
  }
  if (initSection.section === 2 || initSection.section === 3){
    if (step.value <= 0){
      if (angle < time && angle > 0){
        return;
      }
    }
  }

  if (step.value > 6){
    return;
  }
  // 在终点，既步数step=6时，不允许逆时针旋转的判断
  if (step.value === 6){
    if (initSection.section === 4){ // 判断[0,135)的阈值
      if (angle >= 0 && angle < 135){
        return;
      }
    }
    if (initSection.section === 1){
      if (angle > 0 && angle < 180 && angle > time){
        return
      }
    }
    if (initSection.section !== 1){
      if (angle > time){
        return;
      }
    }
  }

  rotation.value = angle;
  gsap.globalTimeline.timeScale(toothedGearRotationSpeed.value);

  const mask = angle - time > 0 ? angle - time : 360 - time + angle;  // 计算遮罩位置是从初始开始，而不是从0开始
  maskAngle.value = mask;
  isRotationAngle.value = getOneRotation(step.value, time, angle, initSection.section)

  if (isRotationAngle.value){ // 到达一圈后的计算
    document.documentElement.style.setProperty('--mask-angle1', `${mask}deg`);
    document.documentElement.style.setProperty('--mask-angle', `3600deg`);
  }else {
    document.documentElement.style.setProperty('--mask-angle1', `0deg`);
    document.documentElement.style.setProperty('--mask-angle', `${mask}deg`);
  }



}

function stopRotate():void {
  rotating.value = false;
  // 记录遮罩角度和结束角度
  initMaskAngle.value = rotation.value - initStartAngle.value > 0
      ? rotation.value - initStartAngle.value
      : 360 - initStartAngle.value + rotation.value;
  // 结束的位置，让初始的位置，不断逼近它，即执行动画
  endRotation.value = initMaskAngle.value + getCurrentAngle.hoursAngle;

  step.value =  step.value < 0 ? 0 :  step.value;
  gsap.globalTimeline.timeScale(1);
}

function handleStartToEndAngle():void{
  if(isChange.value) return;
  isChange.value = true;
}

function handleClose(): void {
  if(isChange.value) return;
  clear();
  close();
}

/**
 * 把值传递出去
 */
function update(){
  emits('update',initStartAngle.value)
}

function close(){
  emits('close',false)
}

function animateAngle(){
  update();
  gsap.globalTimeline.timeScale(toothedGearRotationSpeed.value);
  minutesAngle.value = initStartAngle.value // 指针位置
  if (isRotationAngle.value){ // 超出一圈时的处理
    if (initStartAngle.value < endRotation.value){
      document.documentElement.style.setProperty('--start-angle', `${initStartAngle.value += 1}deg`);
      document.documentElement.style.setProperty('--mask-angle1', `${initMaskAngle.value -= 1}deg`); // 遮罩角度
    }else {
      isRotationAngle.value = false;
      initMaskAngle.value = 360;
      initStartAngle.value = rotation.value;
      endRotation.value = 360 + rotation.value;
      document.documentElement.style.setProperty('--mask-angle1', `0deg`);
    }
  }else { // 一圈内的处理
    if (initStartAngle.value < endRotation.value) {
      document.documentElement.style.setProperty('--start-angle', `${initStartAngle.value += 1}deg`);
      document.documentElement.style.setProperty('--mask-angle', `${initMaskAngle.value -= 1}deg`); // 遮罩角度
    } else {
      document.documentElement.style.setProperty('--mask-angle', `0deg`);
      document.documentElement.style.setProperty('--mask-angle1', `0deg`);
      gsap.globalTimeline.timeScale(1); // 动画播放速度
      setTimeout(() => {
        isChange.value = false;
        handleClose();
      },500)
    }
  }
}
render();

/**
 * 更新步数
 */
function render(){
  isChange.value && animateAngle();
  requestAnimationFrame(() => {
    render();
  })
}

/**
 * 获取当前扇区和判断顺、逆时针
 * @param e
 * @param angle
 */
function getAreaSection(e:MouseEvent,angle: number){
  let prePos = null;

  if (movePosArr.value.length > 0) {
    prePos = movePosArr.value[movePosArr.value.length - 1];
  }

  // 记录最新的位置
  curPos.value = mousePos(e);
  movePosArr.value[movePosArr.value.length] = curPos.value;

  if (prePos){
    if (angle >= 0 && angle < 90){
      // 右上扇区
      areaSection.value = 1;
      if (prePos.x < curPos.value.x && prePos.y < curPos.value.y){ // 顺时针
        isClock.value = true;
        // clockwiseArrSection.value[0] = 1;
      }else if (prePos.x > curPos.value.x && prePos.y > curPos.value.y){  // 逆时针
        // anticlockwiseArrSection.value[0] = 1;
        isClock.value = false;
      }
    }else if (angle >= 90 && angle < 180){
      // 右下扇区
      areaSection.value = 2;
      if (prePos.x > curPos.value.x && prePos.y < curPos.value.y) {
        isClock.value = true;
        // clockwiseArrSection.value[1] = 1;
      }else if (prePos.x < curPos.value.x && prePos.y > curPos.value.y){
        isClock.value = false
        // anticlockwiseArrSection.value[1] = 1;
      }
    }else if (angle >= 180 && angle < 270){
      // 左下扇区
      areaSection.value = 3;
      if (prePos.x > curPos.value.x && prePos.y > curPos.value.y){
        isClock.value = true;
        // clockwiseArrSection.value[2] = 1;
      }else if(prePos.x < curPos.value.x && prePos.y < curPos.value.y){
        isClock.value = false;
        // anticlockwiseArrSection.value[2] = 1;
      }
    }else if (angle >= 270 && angle < 360) {
      // 左上扇区
      areaSection.value = 4;
      if (prePos.x < curPos.value.x && prePos.y > curPos.value.y){
        isClock.value = true;
        // clockwiseArrSection.value[3] = 1;
      }else if (prePos.x > curPos.value.x && prePos.y < curPos.value.y){
        isClock.value = false;
        // anticlockwiseArrSection.value[3] = 1;
      }
    }
  }
}

/**
 * 计算扇区位置
 * @param e
 * @param angle
 */
function calculateSector(e:MouseEvent,angle: number){
  getAreaSection(e,angle)

  // 记录圈数
  // if (areaSection.value){
  //   let clockSections = 0;
  //   let antiClockSections = 0;
  //   for (let i = 0; i < clockwiseArrSection.value.length; i++) {
  //     if (clockwiseArrSection.value[i] === 1) {
  //       clockSections += 1;
  //     }
  //     if (anticlockwiseArrSection.value[i] === 1) {
  //       antiClockSections += 1;
  //     }
  //   }
  //   if (clockSections === 4) {
  //     // 计算顺时针是否为结束扇区的闭合点
  //     cumulate.value += 1;
  //     clearState();
  //   }
  //
  //   if (antiClockSections === 4){ // 计算逆时针是否为结束扇区的闭合点
  //     if (cumulate.value === 0)return
  //     cumulate.value -= 1;
  //     clearState();
  //   }
  // }
}

/**
 * 清除扇区缓存
 */
function clearState(){
  movePosArr.value = [];
  curPos.value = null;
  clearArrSection()
}

function clearArrSection(){
  // for (let i = 0; i < clockwiseArrSection.value.length; i++) {
  //   clockwiseArrSection.value[i] = 0;
  //   anticlockwiseArrSection.value[i] = 0;
  // }
}

/**
 * 为了避免问题关闭窗口，重置参数
 */
function clear(){
  gsap.killTweensOf(horoscope03);
  gsap.killTweensOf(horoscope04);
  gsap.killTweensOf(horoscope05);
  gsap.killTweensOf(horoscope051);
  gsap.killTweensOf(horoscope061);
}
/**
 * 保存当前位置信息
 * @param e
 */
function mousePos(e:MouseEvent){
  if (e.pageX || e.pageY) {
    return { x: e.pageX, y: e.pageY };
  }
  return {
    x: e.clientX + document.body.scrollLeft - document.body.clientLeft,
    y: e.clientY + document.body.scrollTop - document.body.clientTop
  };
}

/**
 * 获取是否到达一圈
 * @param step 顺时针经过的扇区数
 * @param initAngle 默认角度
 * @param angle 滑动角度
 * @param section 当前所处扇区
 */
function getOneRotation(step:number,initAngle:number,angle:number,section:number){
  if (step > 3){
    return  true;
  }
  if (step === 3){
    if (section === 1){ // 处于第一扇区时，判断[0,90)区间
      return angle > initAngle && angle >= 0 && angle < 90;
    }
    if (section === 2 || section === 3){
      return angle > initAngle;
    }
    if (section === 4){ // 处于第四扇区时，当前角度大于或跨越到第一扇区，判断[0 135]区间的阈值
      return (angle > initAngle && angle >= 270 && angle < 360) || (angle >= 0 && angle < 135)
    }
  }
  return false;
}
/**
 * 获取当前时间的角度
 * @param time
 */
function getCurrentTimeAngles(time: Date = new Date()) {
  const now = time;
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const hoursAngle = hours * 15; // 0度为12点
  const minutesAngle = minutes * 6;
  let endHoursAngle = hoursAngle < 180 ? 180 + hoursAngle : hoursAngle - 180
  return { hoursAngle: endHoursAngle, minutesAngle };
}

/**
 * 获取默认扇区
 * @param angle
 */
function getInitSection(angle: number){
  let section = 0
  if (angle >= 0 && angle < 90){
    section = 1
  }else if (angle >= 90 && angle < 180){
    section = 2
  }else if (angle >= 180 && angle < 270){
    section = 3
  }else if (angle >= 270 && angle < 360){
    section = 4
  }
  let pre = 0; // 前一个扇区
  let next = 0; // 后一个扇区
  switch (section) {
    case 1: pre = 4; next = 2; break;
    case 2: pre = 1; next = 3; break;
    case 3: pre = 2; next = 4; break;
    case 4: pre = 3; next = 1; break;
  }
  return { section, pre, next }
}
</script>

<style scoped lang="less">
.clock-container{
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 9;
  background: linear-gradient( -90deg,#000000, 50%, transparent);
}

.clock-header{
  text-align: right;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
.clock-container_wrapper{
  position: relative;
  transform: translate(-50%,-50%);
  top: 40%;
  left: 70%;
  width: 700px;
  height: 400px;
  display: flex;
  justify-items: center;
  justify-content: space-between;
  text-align: center;
}
.clock-con_left{
  flex: 1;
}
.clock-con_right{
  width: 400px;
  height: 100%;
  position: relative;
}

.clock_unit{
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  text-align: center;
}

.star_particles{
  background: url("images/star_particles.gif") no-repeat center;
  background-size: 45%;
}

.clock_bg{
  background-image: url("images/Clock_BG.png");
  background-size: 100%, 100%;
}

.clock_dial{
  background: url("images/UI_Clock_Dial.png") no-repeat center;
  background-size: 86%;
}

.clock_hbg{
  background: url("images/UI_Img_HoroscopeBg.png");
  background-size: 100%, 100%;
}

.clock_unit_mask{
  position: relative;
  transform: translate(-50%,-50%);
  width: 45%;
  height: 45%;
  left: 50%;
  top: 50%;
  text-align: center;
  border-radius: 50%;
  overflow: hidden;
}
.clock_unit_mask_wrapper{
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
}

.timeZone_wrapper{
  position: absolute;
  width: 100%;
  height: 100%;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
}

.center{
  position: absolute;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  width: 25%;
  height: 25%;
}

.center-clock{
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.center_35{
  width: 35%;
  height: 35%;
  opacity: 0.6;
}
.center_50{
  width: 50%;
  height: 50%;
}
.center_90{
  width: 90%;
  height: 90%;
}

.clock_horoscope03{
  background: url("images/UI_Img_Horoscope03.png") no-repeat;
  background-size: 100%;
  left: 5%;
  top: -5%;
  //animation: rotationUp 40s linear infinite;
}

.clock_horoscope04{
  background: url("images/UI_Img_Horoscope04.png") no-repeat;
  transform: rotate(40deg);
  background-size: 100%;
  left: -12%;
  top: 15%;
  //animation: rotationUp 40s linear infinite;
}

.clock_horoscope05{
  background: url("images/UI_Img_Horoscope05.png") no-repeat;
  background-size: 100%;
  left: 94%;
  top: 60%;
  //animation: rotationDown 20s linear infinite;
}

.clock_horoscope05_1{
  background: url("images/UI_Img_Horoscope05.png") no-repeat;
  background-size: 100%;
  left: 140%;
  top: 95%;
  //animation: rotationDown 30s linear infinite;
}

.clock_horoscope06{
  background: url("images/UI_Img_Horoscope06.png") no-repeat;
  background-size: 100%;
}
.clock_horoscope06_1{
  top: -190%;
  left: 80%;
  //animation: rotationUp 30s linear infinite;
}

.sun_state{
  position: absolute;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  width: 16%;
  height: 98%;
}
.noon_state{
  position: absolute;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  width: 85%;
  height: 16%;
}
.morning{
  background: url("images/UI_ClockIcon_Morning.png") no-repeat;
  background-size: 100%;
  left: 14%;
}
.dusk{
  background: url("images/UI_ClockIcon_Dusk.png") no-repeat;
  background-size: 100%;
  left: 86%;
}
.night{
  background: url("images/UI_ClockIcon_Night.png") no-repeat;
  background-size: 100%;
  top: 87%;
}
.noon{
  background: url("images/UI_ClockIcon_Noon.png") no-repeat;
  background-size: 100%;
  top: 15%;
}

.clock_hourHand{
  background: url("images/UI_Clock_HourHand.png");
  background-size: 100%, 100%;
}

.clock_minuteHand{
  background: url("images/UI_Clock_MinuteHand.png");
  background-size: 100%, 100%;
  transform: rotate(180deg);
}

.clock_TimeZone{
  background: url("images/UI_Clock_TimeZoneColor.png") no-repeat;
  mask-image: url("images/UI_Clock_TimeZone.png");
  mask-size: cover;
  background-size: 100%;
}
.clock_TimeZone::after{
  position: absolute;
  content: '';
  background: conic-gradient(from var(--start-angle), transparent 0deg var(--mask-angle) ,rgba(0,0,0,0.8) 0deg 360deg);
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.clock_TimeZone_1{
  width: 95%;
  height: 95%;
  background-size: 100%;
}
.clock_TimeZone_1::after{
  background: conic-gradient(from var(--start-angle), transparent 0deg var(--mask-angle1) ,rgba(0,0,0,0.8) 0deg 360deg);
}

.clock-btn{
  position: absolute;
  transform: translate(-50%,-50%);
  top: 110%;
  left: 50%;
  padding: 8px 50px;
  color: white;
  border-radius: 4px;
  background: #262626;
  border: 1px solid #3c3c3c;
  cursor: pointer;
  &:hover{
    background: #3c3c3c;
  }
}

@keyframes rotationDown {
  0%{
    rotate: 0deg;
  }
  100%{
    rotate: calc(var(--rotate-step)* 360deg);
  }
}
@keyframes rotationUp {
  0%{
    rotate: 0deg;
  }
  100%{
    rotate: calc(var(--rotate-step) * -360deg);
  }
}

</style>

