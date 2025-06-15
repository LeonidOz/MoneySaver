require('dotenv').config();
const express = require('express');
const TronWeb = require('tronweb');
const bodyParser = require('body-parser');
const fs = require('fs');
const wallets = JSON.parse(fs.readFileSync('./wallets.json', 'utf8')); // 🔐 Кошельки и ключи
const morgan = require('morgan');

const app = express();
app.use(morgan('combined')); // Логирует HTTP-запросы в консоль
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// TRON конфиг
const tronWeb = new TronWeb({
    fullHost: process.env.TRON_FULL_NODE || 'https://api.trongrid.io',
    privateKey: process.env.TRON_DEFAULT_PRIVATE_KEY
});

app.all('/', async (req, res) => {
    const { wallet, amount } = req.query.wallet ? req.query : req.body;

    if (!wallet || !amount || isNaN(amount) || amount <= 0) {
        console.log(`[${new Date().toISOString()}] ❌ Invalid wallet or amount: ${JSON.stringify({ wallet, amount })}`);
        return res.status(400).send('❌ Invalid wallet or amount (must be a positive number)');
    }

    if (!wallets[wallet]) {
        console.log(`[${new Date().toISOString()}] ❌ Неизвестный кошелек`);
        return res.status(400).send('❌ Неизвестный кошелек');
    }

    const [privateKey, toAddress] = wallets[wallet];

    if (wallet.startsWith('T')) {
        try {
            const isActivated = await tronWeb.trx.getAccount(wallet);
            if (!isActivated) {
                throw new Error(`Кошелек ${wallet} не активирован. Сначала отправьте на него TRX`);
            }
            const usdtContract = await tronWeb.contract().at(process.env.TRON_USDT_CONTRACT);
            tronWeb.setPrivateKey(privateKey);

            const balance = await usdtContract.balanceOf(wallet).call();
            const balanceNum = balance.toNumber(); // Конвертируем BigNumber в число

            if (balanceNum < tronWeb.toSun(amount)) {
                throw new Error(`Недостаточно USDT на балансе (есть: ${balanceNum / 1e6}, требуется: ${amount}`);
            }
            console.log(`Баланс USDT: ${balanceNum / 1e6}`);

            const tx = await usdtContract.transfer(
                toAddress,
                tronWeb.toSun(amount)
            ).send();

            console.log(`[${new Date().toISOString()}] ✅ TX Sent: ${tx}`);
            return res.send(`✅ TRC20 USDT sent: TXID ${tx}`);
        } catch (e) {
            console.log(`[${new Date().toISOString()}] ❌ TRC20 Error: ${e.message}`);
            return res.status(500).send('❌ TRC20 Error: ' + e.message);
        }
    }

    if (wallet.startsWith('0x')) {
        const { Web3 } = require('web3');
        const { HttpProvider } = require('web3-providers-http');

        const RPC_URL = 'https://ethereum-rpc.publicnode.com';
        const web3 = new Web3(new HttpProvider(RPC_URL));

        // USDT ERC20
        const USDT_CONTRACT = process.env.ETH_USDT_CONTRACT;
        const USDT_ABI = [
            {
                "constant": true,
                "inputs": [{ "name": "_owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "balance", "type": "uint256" }],
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    { "name": "_to", "type": "address" },
                    { "name": "_value", "type": "uint256" }
                ],
                "name": "transfer",
                "outputs": [{ "name": "", "type": "bool" }],
                "type": "function"
            }
        ];

        try {
            const account = wallet;
            const privateKeyHex = wallets[wallet][0];
            const privateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
            const toAddress = wallets[wallet][1];

            const contract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT);
            const value = BigInt(Math.floor(amount * 1e6)); // 6 знаков после запятой

            const balance = await contract.methods.balanceOf(account).call({});
            const balanceBN = BigInt(balance);

            if (balanceBN < value) {
                throw new Error(`Недостаточно USDT (есть: ${Number(balanceBN) / 1e6}, требуется: ${amount}`);
            }
            console.log(`Баланс USDT: ${Number(balanceBN) / 1e6}`);

            const data = contract.methods.transfer(toAddress, value.toString()).encodeABI();
            const nonce = await web3.eth.getTransactionCount(account, 'pending');
            const gasPrice = await web3.eth.getGasPrice();

            const txParams = {
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(gasPrice),
                gas: web3.utils.toHex(100000),
                to: USDT_CONTRACT,
                value: '0x0',
                data: data,
                chainId: 1
            };

            const signedTx = await web3.eth.accounts.signTransaction(txParams, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            console.log(`[${new Date().toISOString()}] ✅ TX Sent: ${receipt.transactionHash}`);
            return res.send(`✅ ERC20 USDT sent: TXID ${receipt.transactionHash}`);
        } catch (e) {
            console.log(`[${new Date().toISOString()}] ❌ ERC20 Error: ${e.message}`);
            return res.status(500).send('❌ ERC20 Error: ' + e.message);
        }
    }

    console.log(`[${new Date().toISOString()}] ❌ Unknown wallet type: ${wallet}`);
    res.status(400).send('❌ Unknown wallet type');
});

const PORT = process.env.PORT || 3020;
app.listen(PORT, () => console.log('🚀 Server running on port: '+PORT));