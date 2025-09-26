// graphState.js
import { BaseMessage } from "@langchain/core/messages";

export const agentState = {
  userInput: {
    value: null,
    default: () => "",
  },
  parsedInput: {
    value: null,
    default: () => ({}),
  },
  convertedPrice: {
    value: null,
    default: () => 0,
  },
  finalPrice: {
    value: null,
    default: () => 0,
  },
  result: {
    value: null,
    default: () => "",
  },
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
};