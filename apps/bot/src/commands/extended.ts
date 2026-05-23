/** @deprecated Import from ./handlers/* — kept for compatibility */
export { handleConfig, handleAdmin, handleBrain, handleSuggest, handleClearwarn, handleNickname, handlePlayMusic } from "./handlers/admin.js";
export {
  handleBalance,
  handlePay,
  handleRob,
  handleCrime,
  handleDeposit,
  handleWithdraw,
  handleLeaderboard,
  handleShop,
  handleDaily,
  handleWeekly,
  handleMonthly,
  handleWork,
  handleEco,
  handleBuy,
  handleUse,
} from "./handlers/economy.js";
export { handleFun } from "./handlers/fun.js";
export { handleTicket, buildTicketRow } from "./handlers/tickets.js";
