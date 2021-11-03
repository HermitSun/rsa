import RSA from "../rsa";

addEventListener(
  "message",
  (e: MessageEvent<number>) => {
    postMessage(RSA.genKeyPair(e.data));
  },
  false
);
