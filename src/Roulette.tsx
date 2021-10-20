import {Box, Button, Grid, Paper} from "@material-ui/core";
import 'roulette-board/dist/index.css'
import styled from "styled-components";
import * as React from "react";
import {Dispatch, useEffect, useState} from "react";
import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {PublicKey} from "@solana/web3.js";
import {WalletDialogButton} from "@solana/wallet-adapter-material-ui";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {FormControlLabel, Switch} from "@mui/material";
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

const USDC: PublicKey = new PublicKey(
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
);


const ConnectButton = styled(WalletDialogButton)``;
const SpinButton = styled(Button)`{
  background-color: #ff9800;
  margin: 2px
}`; // add your styles here
const SpacedGrid = styled(Grid)`{
  margin: 2px
}`; // add your styles here

const MintButton = styled(Button)`{
  background-color: #008CBA;
}`; // add your styles here
const Item = styled(Paper)(({theme}) => ({
    textAlign: 'center',
}));

export interface RouletteProps {
    connection: anchor.web3.Connection;
    txTimeout: number;
}

export interface RandoPDA {
    nonce: number,
    numericResult: number,
    requestReference: PublicKey,
    oracleResults: Array<number>,
    result: Array<number>
}

export interface BetPDA {
    side: number,
    status: number,
    rolled: boolean,
    vault: string,
    ball: number,
    bets: Array<number>
}

export interface GameState {
    authority: PublicKey,
    mint: PublicKey,
    poolAccount: PublicKey,
    poolSigner: PublicKey,
    poolSignerBump: number,
    initialized: boolean
}


export interface NumberProps {
    number: number,
    shows: boolean,
    betResult?: BetPDA
    tableBet?: TableBet,
    onClick?: () => any
}


type TableBet = Record<number, number>

const NumberButton = (props: NumberProps) => {
    let darkRed = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3]
    let black = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26]
    let wholeRow = [37, 38, 39];
    let textX = 14
    let textY = 30
    let color = 'green';
    let ellipseColor = 'green'
    let winning_color = '#a5d6a7'
    if (darkRed.includes(props.number)) {
        ellipseColor = 'darkred'
    }
    if (black.includes(props.number)) {
        ellipseColor = 'black'
    }

    let text = props.shows ? props.number : ''
    if (wholeRow.includes(props.number)) {
        text = '2to1'
        textX = 3
    }

    if (props.number >= 10 && props.number < 37) {
        textX -= 4
    }

    if (props.number >= 99) {
        return <svg width="38" height="50"/>
    }

    let numberTableBet = props.tableBet ? props.tableBet[props.number] : 0

    /// 12s
    if (props.number >= 40 && props.number <= 42) {
        let text = ""
        let color = ""
        switch (props.number) {
            case 40:
                text = "1 - 12";
                color = props.tableBet && props.betResult && (props.betResult.ball >= 1 && props.betResult.ball <= 12) && props.tableBet[40] > 0 ? winning_color : 'green';
                break;

            case 41:
                text = "13 - 24";
                color = props.tableBet && props.betResult && (props.betResult.ball >= 13 && props.betResult.ball <= 24) && props.tableBet[41] > 0 ? winning_color : 'green';
                break;

            case 42:
                text = "25 - 36";
                color = props.tableBet && props.betResult && (props.betResult.ball >= 25 && props.betResult.ball <= 36) && props.tableBet[42] > 0 ? winning_color : 'green';
                break;


        }
        return (<svg width="152" height="50" onClick={props.onClick}>
            <g>
                <rect x="0" y="0" width="152" height="50" fill={color}></rect>
                <rect x="0" y="0" width="152" height="50" fill={"none"} stroke={"white"}></rect>
                <text pointer-events={"none"} x="50" y={textY} fill="white">{text}</text>
                {numberTableBet > 0 ? (<text x={135} y={45} fill="white" fontSize="10">{numberTableBet}</text>) :
                    <div/>}
            </g>
        </svg>)
    }

    /// last row
    if (props.number >= 43 && props.number <= 48) {
        let text = ""
        let color = 'green'
        switch (props.number) {
            case 43:
                text = "1 - 18";
                textX = 15;
                color = props.tableBet && props.betResult && props.betResult.ball >= 1 && props.betResult.ball <= 18 && props.tableBet[43] > 0 ? winning_color : 'green';
                break;
            case 44:
                text = "EVEN";
                textX = 15;
                color = props.tableBet && props.betResult && props.betResult.ball > 0 && props.betResult.ball % 2 === 0 && props.tableBet[44] > 0 ? winning_color : 'green';
                break;

            case 46:
                text = "⚫";
                textX = 30;
                color = props.tableBet && props.betResult && [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26].includes(props.betResult.ball) && props.tableBet[46] > 0 ? winning_color : 'green';
                break;

            case 45:
                text = "🔴";
                textX = 30;
                color = props.tableBet && props.betResult && [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3].includes(props.betResult.ball) && props.tableBet[45] > 0 ? winning_color : 'green';
                break;

            case 47:
                text = "ODD️";
                textX = 16;
                color = props.tableBet && props.betResult && props.betResult.ball % 2 === 1 && props.tableBet[47] > 0 ? winning_color : 'green';
                break;

            case 48:
                text = "19-36";
                textX = 15;
                color = props.tableBet && props.betResult && props.betResult.ball >= 19 && props.betResult.ball <= 36 && props.tableBet[48] > 0 ? winning_color : 'green';
                break;
        }
        return (<svg width="76" height="50" onClick={props.onClick}>
            <g>
                <rect x="0" y="0" width="76" height="50" fill={color}></rect>
                <rect x="0" y="0" width="76" height="50" fill={"none"} stroke={"white"}></rect>
                <text x={textX} y={textY} fill="white">{text}</text>
                {numberTableBet > 0 ? (<text x={62} y={45} fill="white" fontSize="10">{numberTableBet}</text>) : <div/>}
            </g>
        </svg>)
    }

    let winningIcon = ''
    if (props.betResult && props.number === props.betResult.ball && props.betResult.rolled) {
        winningIcon = '🌟'
        color = '#ff9800'
        ellipseColor = '#ff9800'
        if (props.tableBet && props.tableBet[props.number] > 0) {
            color = winning_color
        }
    }
    // highlight 2to1
    if (props.tableBet && props.betResult && props.betResult.ball) {
        let third_row = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
        let second_row = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
        let first_row = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]

        if (props.tableBet[props.number] > 0 && props.number === 37 && third_row.includes(props.betResult.ball)) {
            color = winning_color
            ellipseColor = winning_color
        }
        if (props.tableBet[props.number] > 0 && props.number === 38 && second_row.includes(props.betResult.ball)) {
            color = winning_color
            ellipseColor = winning_color
        }
        if (props.tableBet[props.number] > 0 && props.number === 39 && first_row.includes(props.betResult.ball)) {
            color = winning_color
            ellipseColor = winning_color
        }
    }

    /// individual number
    return (<svg width="38" height="50" onClick={props.onClick}>
        <g>
            <rect x="0" y="0" width="38" height="50" fill={color}></rect>
            <rect x="0" y="0" width="38" height="50" fill={"none"} stroke={"white"}></rect>
            <ellipse cx="19" cy="25" rx="15" ry="20" fill={ellipseColor}/>
            <text x={textX - 11} y={textY + 15} fill="white">{winningIcon}</text>
            <text x={textX} y={textY} fill="white">{text}</text>
            {numberTableBet > 0 ? (<text x={25} y={45} fill="white" fontSize="10">{numberTableBet}</text>) : <div/>}
        </g>
    </svg>)


}
const add = (a: number, b: number) => a + b;


async function findAssociatedTokenAddress(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey
): Promise<PublicKey> {
    return (await PublicKey.findProgramAddress(
        [
            walletAddress.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            tokenMintAddress.toBuffer(),
        ],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    ))[0];
}


const Roulette = (props: RouletteProps) => {
    const [usdcBalance, setUsdcBalance] = useState<number>();
    const [poolBalance, setPoolBalance] = useState<number>();
    const [provider, setProvider] = useState<Provider>();
    const [randoProgram, setRandoProgram] = useState<Program>();
    const [rouletteProgram, setRouletteProgram] = useState<Program>();
    const [betResult, setBetResult] = useState<BetPDA>();
    const [randoResult, setRandoResult] = useState<RandoPDA>();
    const [tableBet, setTableBet] = useState<TableBet>();
    const [maxListener, setMaxListener] = useState<number>()
    const [rouletteStateSigner, setRouletteStateSigner] = useState<PublicKey>()
    const [stateBump, setStateBump] = useState<number>()
    const [poolAccount, setPoolAccount] = useState<PublicKey>()
    const [betUsdc, setBetUsdc] = useState<boolean>()


    const wallet = useAnchorWallet();

    const updateBalances = async (usdcAddress: PublicKey, setStateFn: Dispatch<number>) => {
        try {
            const newUsdcBalance = (await props.connection.getTokenAccountBalance(usdcAddress)).value.uiAmount
            setStateFn(newUsdcBalance ? newUsdcBalance : 0)
        } catch (e) {

        }
    }

    useEffect(() => {
        (async () => {
            if (wallet) {
                const provider = new anchor.Provider(props.connection, wallet as anchor.Wallet, Provider.defaultOptions());
                const randoProgram = await anchor.Program.at('CFVk3Q9pN3W7qJaZbkmR5Jeb6TXsh51oSLvgEn3Szjd9', provider)
                const rouletteProgram = await anchor.Program.at('DUu5HN7Sqb7vsjpc4EdkEqKpUBdEs3tyfGDd9FSvGpdZ', provider)
                setProvider(provider)
                setRandoProgram(randoProgram)
                setRouletteProgram(rouletteProgram)

                let [
                    rouletteStateSigner,
                    stateBump,
                ] = await anchor.web3.PublicKey.findProgramAddress(
                    [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
                    rouletteProgram.programId);

                const state = await rouletteProgram.account.gameState.fetch(rouletteStateSigner) as GameState
                setPoolAccount(state.poolAccount);
                setRouletteStateSigner(rouletteStateSigner)
                setStateBump(stateBump)


                const usdcAddress = await findAssociatedTokenAddress(wallet.publicKey, USDC)

                updateBalances(usdcAddress, setUsdcBalance)
                provider.connection.onAccountChange(usdcAddress, async () => {
                    updateBalances(usdcAddress, setUsdcBalance)

                })
                updateBalances(state.poolAccount, setPoolBalance)
                provider.connection.onAccountChange(state.poolAccount, async () => {
                    updateBalances(state.poolAccount, setPoolBalance)
                })

            }
        })();
    }, [wallet, props.connection]);


    const onClick = async (n: number) => {
        if (tableBet === undefined) {
            return
        }
        if (tableBet[n] === undefined) {
            tableBet[n] = 1
            setTableBet({...tableBet})
            console.log("setstate")
        } else {
            tableBet[n] = tableBet[n] + 1
            setTableBet({...tableBet})
        }
    }

    const onSpin = async (isRealBet: boolean) => {
        const ref = new anchor.web3.Keypair()

        if (!tableBet || !randoProgram || !provider || !rouletteProgram || !wallet) {
            return
        }
        let bets = [...new Array(64).fill(0)]
        for (let i = 0; i < 64; i++) {
            bets[i] = tableBet[i] ? tableBet[i] : 0
        }

        let [
            vaultSigner,
            nonce,
        ] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("request-reference-seed")), ref.publicKey.toBuffer()],
            randoProgram.programId
        );

        let [
            betSigner,
            betNonce,
        ] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("bet")), ref.publicKey.toBuffer()],
            rouletteProgram.programId
        );

        if (maxListener) {
            try {
                await provider.connection.removeProgramAccountChangeListener(maxListener)
                await provider.connection.removeProgramAccountChangeListener(maxListener - 1)
            } catch (e) {

            }
        }

        console.log(ref.publicKey.toString(), vaultSigner.toString())
        const a = provider.connection.onProgramAccountChange(randoProgram.programId, async (p) => {
            let resultJson = await randoProgram.account.randoResult.fetch(p.accountId) as RandoPDA
            if (resultJson.requestReference.toString() === ref.publicKey.toString()) {
                setRandoResult(resultJson)
            }
        })

        const b = provider.connection.onProgramAccountChange(rouletteProgram.programId, async (p) => {
            try {
                const betResultJson = await rouletteProgram.account.bet.fetch(p.accountId) as BetPDA
                betResultJson.vault = betResultJson.vault.toString()
                if (betResultJson.vault === vaultSigner.toString()) {
                    setBetResult(betResultJson)
                    if (betResultJson.rolled) {
                        toast(`🎲 Ball landed on ${betResultJson.ball}`, {
                            position: "bottom-left",
                            autoClose: 10000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                        });

                            toast(`🧧 Received $${betResultJson.bets.reduce(add) + betResultJson.status} ($${betResultJson.status > 0 ? '+': ''}${betResultJson.status})`, {
                                position: "bottom-left",
                                autoClose: 10000,
                                hideProgressBar: true,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: false,
                                progress: undefined,
                            });
                    }
                }
            } catch (e) {
                console.log(e)
            }
        })

        setMaxListener(b)

        const spinAccount = {
            bet: betSigner,
            solanaAnchorRandoProgram: randoProgram.programId,
            requester: rouletteProgram.provider.wallet.publicKey,
            requesterUsdcAccount: await findAssociatedTokenAddress(wallet.publicKey, USDC),
            state: rouletteStateSigner,
            poolAccount,
            requestReference: ref.publicKey,
            vault: vaultSigner,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId
        }

        console.log(spinAccount)

        try {

            toast.info(`Waiting for transaction...`, {
                position: "bottom-left",
                autoClose: 10000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
            });

            await rouletteProgram.rpc.spin(nonce, betNonce, stateBump, bets, isRealBet, {
                accounts: spinAccount
            })

            toast.success(`Bet $${bets.reduce(add)}. Waiting for ball to land...`, {
                position: "bottom-left",
                autoClose: 10000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
            });


        } catch (e) {
            toast.error("Transaction error")
            console.log(e)
        }
    }

    const onClear = () => {
        setTableBet({})
        setBetResult(undefined)
        setRandoResult(undefined)
    }
    if (!tableBet) {
        setTableBet({})
    }
    return (
        <div>
            <Box sx={{flexGrow: 1}}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{mr: 2}}
                        >
                        </IconButton>
                        <Typography style={{userSelect: "none"}} variant="h6" component="div" sx={{flexGrow: 1}}>
                            🎲 Rando Roulette
                        </Typography>

                        {!wallet ? (
                            <ConnectButton>Connect Wallet</ConnectButton>
                        ) : (
                            <div>
                            </div>)}
                        <div>
                            {wallet && (
                                <div>
                                    <p style={{userSelect: "none"}}>Pool Balance:
                                        ${(poolBalance || 0).toLocaleString()}</p>
                                    <p style={{userSelect: "none"}}>USDC Balance:
                                        ${(usdcBalance || 0).toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                    </Toolbar>
                </AppBar>
            </Box>

            <Box sx={{flexGrow: 1}}>
                <SpacedGrid container justifyContent="center">
                    <SpacedGrid item>

                    </SpacedGrid>
                    <SpacedGrid container item direction="row" justifyContent="space-around">
                        <SpacedGrid container item direction="column" spacing={0} xs={6}>
                            <Grid container item direction="row" justifyContent="center">
                                <NumberButton betResult={betResult} number={0} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(0)}/>
                                <NumberButton betResult={betResult} number={3} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(3)}/>
                                <NumberButton betResult={betResult} number={6} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(6)}/>
                                <NumberButton betResult={betResult} number={9} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(9)}/>
                                <NumberButton betResult={betResult} number={12} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(12)}/>
                                <NumberButton betResult={betResult} number={15} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(15)}/>
                                <NumberButton betResult={betResult} number={18} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(18)}/>
                                <NumberButton betResult={betResult} number={21} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(21)}/>
                                <NumberButton betResult={betResult} number={24} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(24)}/>
                                <NumberButton betResult={betResult} number={27} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(27)}/>
                                <NumberButton betResult={betResult} number={30} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(30)}/>
                                <NumberButton betResult={betResult} number={33} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(33)}/>
                                <NumberButton betResult={betResult} number={36} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(36)}/>
                                <NumberButton betResult={betResult} number={37} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(37)}/>
                            </Grid>
                            <Grid container item direction="row" justifyContent="center">
                                <NumberButton betResult={betResult} number={0} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(0)}/>
                                <NumberButton betResult={betResult} number={2} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(2)}/>
                                <NumberButton betResult={betResult} number={5} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(5)}/>
                                <NumberButton betResult={betResult} number={8} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(8)}/>
                                <NumberButton betResult={betResult} number={11} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(11)}/>
                                <NumberButton betResult={betResult} number={14} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(14)}/>
                                <NumberButton betResult={betResult} number={17} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(17)}/>
                                <NumberButton betResult={betResult} number={20} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(20)}/>
                                <NumberButton betResult={betResult} number={23} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(23)}/>
                                <NumberButton betResult={betResult} number={26} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(26)}/>
                                <NumberButton betResult={betResult} number={29} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(29)}/>
                                <NumberButton betResult={betResult} number={32} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(32)}/>
                                <NumberButton betResult={betResult} number={35} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(35)}/>
                                <NumberButton betResult={betResult} number={38} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(38)}/>
                            </Grid>
                            <Grid container item direction="row" justifyContent="center">
                                <NumberButton betResult={betResult} number={0} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(0)}/>
                                <NumberButton betResult={betResult} number={1} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(1)}/>
                                <NumberButton betResult={betResult} number={4} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(4)}/>
                                <NumberButton betResult={betResult} number={7} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(7)}/>
                                <NumberButton betResult={betResult} number={10} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(10)}/>
                                <NumberButton betResult={betResult} number={13} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(13)}/>
                                <NumberButton betResult={betResult} number={16} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(16)}/>
                                <NumberButton betResult={betResult} number={19} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(19)}/>
                                <NumberButton betResult={betResult} number={22} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(22)}/>
                                <NumberButton betResult={betResult} number={25} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(25)}/>
                                <NumberButton betResult={betResult} number={28} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(28)}/>
                                <NumberButton betResult={betResult} number={31} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(31)}/>
                                <NumberButton betResult={betResult} number={34} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(34)}/>
                                <NumberButton betResult={betResult} number={39} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(39)}/>
                            </Grid>
                            <Grid container item direction="row" justifyContent="center">
                                <NumberButton betResult={betResult} number={99} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(99)}/>
                                <NumberButton betResult={betResult} number={40} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(40)}/>
                                <NumberButton betResult={betResult} number={41} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(41)}/>
                                <NumberButton betResult={betResult} number={42} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(42)}/>
                                <NumberButton betResult={betResult} number={99} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(99)}/>

                            </Grid>
                            <Grid container item direction="row" justifyContent="center">
                                <NumberButton betResult={betResult} number={99} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(99)}/>
                                <NumberButton betResult={betResult} number={43} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(43)}/>
                                <NumberButton betResult={betResult} number={44} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(44)}/>
                                <NumberButton betResult={betResult} number={45} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(45)}/>
                                <NumberButton betResult={betResult} number={46} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(46)}/>
                                <NumberButton betResult={betResult} number={47} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(47)}/>
                                <NumberButton betResult={betResult} number={48} shows={true} tableBet={tableBet}
                                              onClick={() => onClick(48)}/>
                                <NumberButton betResult={betResult} number={99} shows={false} tableBet={tableBet}
                                              onClick={() => onClick(99)}/>
                            </Grid>
                        </SpacedGrid>
                    </SpacedGrid>
                    <Typography> </Typography>
                    <SpacedGrid item spacing={2}>
                        {wallet && tableBet !== {} ?
                            <FormControlLabel
                                control={
                                    <Switch checked={betUsdc} onChange={() => {
                                        setBetUsdc(!betUsdc)
                                    }} size="small" name="gilad"/>
                                }
                                label="Bet USDC"
                            /> : <div/>}
                        {wallet && tableBet !== {} ?
                            <SpinButton onClick={() => onSpin(betUsdc ? betUsdc : false)}>Spin</SpinButton> : <div/>}
                        <SpinButton onClick={onClear}>Clear</SpinButton>
                    </SpacedGrid>
                    <SpacedGrid item container justifyContent="center">
                    </SpacedGrid>
                    <SpacedGrid item xs={6}>
                        <div>
                            {randoResult ?
                                <div>
                                    <Paper elevation={3}>
                                        <Typography variant="h6" p={1}>Verify Randomness </Typography>
                                        <Typography p={1}
                                                    style={{wordWrap: 'break-word'}}>Seed: {JSON.stringify(Array.from(Uint8Array.from(randoResult?.requestReference.toBuffer())))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Signer1
                                            Pubkey: {JSON.stringify(Array.from(Uint8Array.from(new anchor.web3.PublicKey("7xTBX131GqCe9BSuzATaerbJbzvGPzGkcYAtmfxmsKm2").toBuffer())))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Signer1 Results
                                            : {JSON.stringify(randoResult.oracleResults.slice(0, 64))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Signer2
                                            Pubkey: {JSON.stringify(Array.from(Uint8Array.from(new anchor.web3.PublicKey("ChQyts7m59zHwsyRxVPaGiiHifC1Mpd9Eqc3mHSCiLyR").toBuffer())))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Signer2 Results
                                            : {JSON.stringify(randoResult.oracleResults.slice(64, 128))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Aggregated Array
                                            Result: {JSON.stringify(Array.from(Uint8Array.from(randoResult.result)))}</Typography>
                                        <Typography p={1} style={{wordWrap: 'break-word'}}>Random number
                                            result: {new anchor.BN(Array.from(Uint8Array.from(randoResult.result))).toString()} %
                                            37 = {betResult?.ball}</Typography>
                                    </Paper></div> : <div/>}
                        </div>
                    </SpacedGrid>
                    <SpacedGrid item xs={6}>
                        {betResult ? <Paper elevation={3}>
                            <SpacedGrid container item spacing={1} justifyContent="center" direction="column"
                                        alignItems="center">
                                {betResult.rolled ? <SpacedGrid item><Typography
                                        style={{userSelect: "none"}}>Ball: {JSON.stringify(betResult.ball)}</Typography></SpacedGrid> :
                                    <div/>}
                                <SpacedGrid item><Typography style={{userSelect: "none"}}>Total
                                    Bet: {betResult.bets.reduce(add)} USDC</Typography></SpacedGrid>
                                {betResult.rolled ? <SpacedGrid item><Typography style={{userSelect: "none"}}>User
                                        receives: {JSON.stringify(betResult.bets.reduce(add) + betResult.status)} USDC</Typography></SpacedGrid> :
                                    <div/>}
                            </SpacedGrid>
                        </Paper> : <div/>}
                    </SpacedGrid>
                </SpacedGrid>
            </Box>
            <ToastContainer />
        </div>
    )
}

export default Roulette
