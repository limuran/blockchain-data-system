import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { getTokensByChainId, getUniswapRouter, getNetworkName, getWETHAddress } from '../../config/tokens';
import { 
  getTokenBalance, 
  getETHBalance, 
  checkTokenApproval, 
  approveToken, 
  transferToken,
  batchGetTokenBalances
} from '../../utils/tokenUtils';
import { 
  getBestSwapQuote,
  calculateETHForTokens,
  swapETHForToken,
  checkSwapRoute
} from '../../utils/swapUtils';
import SwapModal from '../ui/SwapModal';
import { ethers } from 'ethers';