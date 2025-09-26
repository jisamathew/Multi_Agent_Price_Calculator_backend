import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./graphState.js";
import {
  parseUserInput,
  convertCurrency,
  calculateTax,
  presentResult,
} from "./agents.js";

const workflow = new StateGraph({
  channels: agentState,
});

// Add the nodes
workflow.addNode("parser", parseUserInput);
workflow.addNode("converter", convertCurrency);
workflow.addNode("calculator", calculateTax);
workflow.addNode("presenter", presentResult);

// Define the edges
workflow.setEntryPoint("parser");
workflow.addEdge("parser", "converter");
workflow.addEdge("converter", "calculator");
workflow.addEdge("calculator", "presenter");
workflow.addEdge("presenter", "__end__");


// Compile the graph
export const app = workflow.compile();