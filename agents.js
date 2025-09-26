// agents.js

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import axios from "axios";
// import SalesTax from "sales-tax";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Agent 1: Input Parser
export async function parseUserInput(state) {
  const anaylzePrompt = `Please extract the base price, source currency, destination currency, and tax percentage from the following user prompt.
    User Prompt: ${state.userInput}
    Respond with a JSON object that strictly follows the provided schema.`;

  const extractionSchema = {
    type: "object",
    properties: {
      price: {
        type: "number",
        description: "The base price of the product.",
      },
      sourceCurrency: {
        type: "string",
        description: "The three-letter ISO currency code for the source currency (e.g., INR, USD).",
      },
      destinationCurrency: {
        type: "string",
        description: "The three-letter ISO currency code for the destination currency (e.g., AED, EUR).",
      },
      tax: {
        type: "number",
        description: "The tax percentage to be applied.",
      },
    },
    required: ["price", "sourceCurrency", "destinationCurrency", "tax"],
  };

  const structuredOutput = model.withStructuredOutput(extractionSchema);
  const response = await structuredOutput.invoke(anaylzePrompt);
  return { parsedInput: response };
}

// Agent 2: Currency Conversion (UPDATED)
export async function convertCurrency(state) {
  const { price, sourceCurrency, destinationCurrency } = state.parsedInput;
  // Read the new API key from environment variables
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  // Construct the new URL for ExchangeRate-API's pair conversion endpoint
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${sourceCurrency.toUpperCase()}/${destinationCurrency.toUpperCase()}`;

  try {
    const response = await axios.get(url);

    // Defensive check for a successful API response
    if (!response.data || response.data.result !== "success") {
      throw new Error("API call was not successful or returned invalid data.");
    }
    
    // Extract the conversion rate from the new response structure
    const rate = response.data.conversion_rate;
    
    if (!rate) {
      throw new Error(`Could not find a conversion rate for the pair ${sourceCurrency}-${destinationCurrency}`);
    }
    
    const convertedPrice = price * rate;
    return { convertedPrice };
  } catch (error) {
    console.error("Error converting currency:", error.message);
    return { convertedPrice: -1, result: "Sorry, I could not perform the currency conversion. Please check the currency codes." };
  }
}

// Agent 3: Tax Calculation
export async function calculateTax(state) {
  if (state.convertedPrice === -1) return {};
  const { tax } = state.parsedInput;
  const { convertedPrice } = state;
  const finalPrice = convertedPrice * (1 + tax / 100);
  return { finalPrice };
}

// Agent 4: Result Presenter
export async function presentResult(state) {
  if (state.result) return {};
  
  const { price, sourceCurrency, destinationCurrency, tax } = state.parsedInput;
  const { convertedPrice, finalPrice } = state;
  const result = `The price of a product costing ${price} ${sourceCurrency.toUpperCase()} in ${destinationCurrency.toUpperCase()} with a ${tax}% tax is approximately ${finalPrice.toFixed(2)} ${destinationCurrency.toUpperCase()}. The converted price before tax is ${convertedPrice.toFixed(2)} ${destinationCurrency.toUpperCase()}.`;
  return { result };
}