<script setup lang="ts">
import { computed, ref } from "vue";
import RSA, { PrivateKey, PublicKey, RSAKeyPair } from "./rsa";
import RSAKeyWorker from "./workers/keyworker?worker";

// 类型定义
type PublicKeyDisplay = Record<keyof PublicKey, string>;
type PrivateKeyDisplay = Record<keyof PrivateKey, string>;

// 当前进度
const step = ref(0);
function prevStep() {
  step.value = (step.value + 2) % 3;
}
function nextStep() {
  step.value = (step.value + 1) % 3;
}
function resetStep() {
  step.value = 0;
}
// 加载动画
const loading = ref(false);

// 公私钥
let pubKey: PublicKey;
let prvKey: PrivateKey;
const pubKeyDisplay = ref<PublicKeyDisplay>();
const prvKeyDisplay = ref<PrivateKeyDisplay>();
// 密钥长度
const keyLengthOptions = ref(["256", "512", "768", "1024", "2048"]);
const keyLength = ref("768");
const keyLengthDisplay = computed(() =>
  Number(keyLength.value) >= 768
    ? keyLength.value
    : keyLength.value + "（不安全）"
);
// 根据密钥长度进行分块，每一块的大小
let blockSize = 95;
// 分块后每一块生成的密文长度（十进制）
// 不会超过 [log2 * N] + 1
let cipherSize = Math.floor(Math.log10(2) * 768) + 1;
// 生成时间
const keyGenTime = ref(0);

// 生成密钥
function genKeyPair() {
  // 使用 worker 生成密钥，避免主线程卡顿
  // 如果不采用 worker，加载动画会无法显示
  const worker = new RSAKeyWorker();
  loading.value = true;
  // 计时
  const start = performance.now();
  worker.postMessage(Number(keyLength.value));
  worker.onmessage = (e: MessageEvent<RSAKeyPair>) => {
    [pubKey, prvKey] = e.data;
    const end = performance.now();
    keyGenTime.value = end - start;
    // 手动进行序列化
    // CHECKME: JSON 序列化大整数的时候啥时候整出来啊？
    pubKeyDisplay.value = Object.fromEntries(
      Object.entries(pubKey).map(([k, v]) => [k, v.toString()])
    ) as PublicKeyDisplay;
    prvKeyDisplay.value = Object.fromEntries(
      Object.entries(prvKey).map(([k, v]) => [k, v.toString()])
    ) as PrivateKeyDisplay;
    // 计算加密时每一块能容纳的最大字符数
    blockSize = Number(keyLength.value) / 8 - 1;
    cipherSize = Math.floor(Math.log10(2) * Number(keyLength.value)) + 1;
    // 取消加载动画
    loading.value = false;
  };
  // 步骤条 + 1
  nextStep();
}

// 加解密
// 明文
const plainText = ref("");
const plainTextAfterEncrypt = ref("");
const showPlainTextAfterEncrypt = ref(false);
// 加密用时
const encryptTime = ref(0);
// 密文
const cipherText = ref("");
const cipherTextAfterDecrypt = ref("");
const showCipherTextAfterDecrypt = ref(false);
// 解密用时
const decryptTime = ref(0);

// 加密
function encrypt() {
  const blockNums = Math.ceil(plainText.value.length / blockSize);
  const textBlocks = Array<string>(blockNums);

  // 分块加密，计算时间
  const start = performance.now();
  for (let i = 0; i < blockNums; i++) {
    const plainTextBlock = plainText.value.substr(i * blockSize, blockSize);
    // 如果不满足每一块的长度，在最前面补 0
    textBlocks[i] = RSA.encrypt(plainTextBlock, pubKey)
      .toString()
      .padStart(cipherSize, "0");
  }
  plainTextAfterEncrypt.value = textBlocks.join("");
  const end = performance.now();

  encryptTime.value = end - start;
  showPlainTextAfterEncrypt.value = true;
  cipherText.value = plainTextAfterEncrypt.value;
}

// 解密
function decrypt() {
  const blockNums = Math.ceil(cipherText.value.length / cipherSize);
  const textBlocks = Array<string>(blockNums);

  // 分块解密，计算时间
  const start = performance.now();
  for (let i = 0; i < blockNums; i++) {
    // 去掉最前面补位的 0
    const cipherTextBlock = cipherText.value
      .substr(i * cipherSize, cipherSize)
      .replace(/^0+/, "");
    textBlocks[i] = RSA.decrypt(BigInt(cipherTextBlock), prvKey, pubKey);
  }
  cipherTextAfterDecrypt.value = textBlocks.join("");
  const end = performance.now();

  decryptTime.value = end - start;
  showCipherTextAfterDecrypt.value = true;
}
</script>

<template>
  <el-card v-loading.lock="loading" style="margin: 0 auto">
    <!--当前进度-->
    <template #header>
      <el-steps :active="step" finish-status="success">
        <el-step title="生成密钥" />
        <el-step title="加密解密" />
      </el-steps>
    </template>
    <!--第一步-->
    <el-form v-if="step === 0">
      <el-form-item label="密钥长度">
        <el-select
          v-model="keyLength"
          filterable
          allow-create
          placeholder="输入或选择密码长度"
          style="width: 100%"
        >
          <el-option
            v-for="l of keyLengthOptions"
            :key="l"
            :label="Number(l) >= 768 ? l : l + '（不安全）'"
            :value="l"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="success" @click="genKeyPair" style="float: right"
          >生成密钥</el-button
        >
      </el-form-item>
    </el-form>
    <!--第二步-->
    <el-form v-else-if="step === 1" label-width="70px">
      <el-form-item label="密钥长度">{{ keyLengthDisplay }} </el-form-item>
      <el-form-item label="公钥内容">
        <span class="line-wrap">{{ pubKeyDisplay?.n }}</span>
      </el-form-item>
      <el-form-item label="私钥内容">
        <span class="line-wrap">{{ prvKeyDisplay?.d }}</span>
      </el-form-item>
      <el-form-item label="生成用时">
        <span class="line-wrap">{{ keyGenTime }} ms</span>
      </el-form-item>
      <!--加密-->
      <el-divider>加 密</el-divider>
      <el-input
        v-model="plainText"
        autosize
        type="textarea"
        placeholder="输入明文"
      />
      <div v-if="showPlainTextAfterEncrypt">
        <el-form-item label="加密结果">
          <span class="line-wrap">{{ plainTextAfterEncrypt }}</span>
        </el-form-item>
        <el-form-item label="加密用时">
          <span class="line-wrap">{{ encryptTime }} ms</span>
        </el-form-item>
      </div>
      <el-form-item>
        <el-button
          type="primary"
          @click="encrypt"
          style="float: right; margin-top: 20px"
          >加密</el-button
        >
      </el-form-item>
      <!--解密-->
      <el-divider>解 密</el-divider>
      <el-input
        v-model="cipherText"
        autosize
        type="textarea"
        placeholder="输入密文"
      />
      <div v-if="showCipherTextAfterDecrypt">
        <el-form-item label="解密结果">
          <span class="line-wrap">{{ cipherTextAfterDecrypt }}</span>
        </el-form-item>
        <el-form-item label="解密用时">
          <span class="line-wrap">{{ decryptTime }} ms</span>
        </el-form-item>
      </div>
      <el-form-item>
        <el-button
          type="primary"
          @click="decrypt"
          style="float: right; margin-top: 20px"
          >解密</el-button
        >
      </el-form-item>
      <!--底部按钮-->
      <el-button @click="prevStep" style="float: left; margin-bottom: 20px"
        >上一步</el-button
      >
      <el-button
        type="success"
        @click="nextStep"
        style="float: right; margin-bottom: 40px"
        >完 成</el-button
      >
    </el-form>
    <!--结束-->
    <div v-else style="text-align: center">
      <el-button type="success" @click="resetStep">重新开始</el-button>
    </div>
  </el-card>
</template>

<style scoped>
.line-wrap {
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
}
</style>
