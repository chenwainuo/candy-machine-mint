import {useEffect, useState} from "react";
import styled from "styled-components";
import {Button} from "@material-ui/core";

import * as anchor from "@project-serum/anchor";

import {LAMPORTS_PER_SOL} from "@solana/web3.js";

import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletDialogButton} from "@solana/wallet-adapter-material-ui";

import {Provider, Program} from "@project-serum/anchor";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)`{background-color: #008CBA; margin: 2px}`; // add your styles here

export interface HomeProps {
    connection: anchor.web3.Connection;
    txTimeout: number;
}

export interface RandoPDA {
    nonce: number,
    numericResult: number,
    requestReference: string
}
export interface BetPDA {
    side: number,
    status: number,
    vault: string
}

export interface PDAs {
    betPDA: string,
    pda: string
}


const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [provider, setProvider] = useState<Provider>();
    const [program, setProgram] = useState<Program>();
    const [flipCoin, setFlipCoin] = useState<Program>();
    const [pda, setPDA] = useState<PDAs>();
    const [result, setResult] = useState<string>();
    const [betResult, setBetResult] = useState<BetPDA>();
    const [resultJson, setResultJson] = useState<string>();
    const wallet = useAnchorWallet();

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
                const provider = new anchor.Provider(props.connection, wallet as anchor.Wallet, Provider.defaultOptions());
                const program = await anchor.Program.at('CFVk3Q9pN3W7qJaZbkmR5Jeb6TXsh51oSLvgEn3Szjd9', provider)
                const flipCoin = await anchor.Program.at('N8kWwgAvRhf9Qyr5wH1GGMDhvc2TyNJhoEfYXyVzF6F', provider)
                setProvider(provider)
                setProgram(program)
                setFlipCoin(flipCoin)
            }
        })();
    }, [wallet, props.connection]);

    useEffect(() => {
        if (betResult && betResult.status > 0) {
            return
        }
        const interval = setInterval(async () => {
            if (program && pda && provider && flipCoin) {
                try {
                    console.log(betResult)
                    const resultJson = await program.account.randoResult.fetch(pda.pda.toString()) as RandoPDA
                    resultJson.requestReference = resultJson.requestReference.toString()
                    setResultJson(JSON.stringify(resultJson, null, 2))
                    setResult(resultJson.numericResult.toString())

                    const betResultJson = await flipCoin.account.bet.fetch(pda.betPDA.toString()) as BetPDA
                    console.log("vault", betResultJson.vault.toString())
                    betResultJson.vault = betResultJson.vault.toString()

                    let betStatus = ''
                    switch (betResultJson.status) {
                        case 0:
                            betStatus = "Pending..."
                            break
                        case 1:
                            betStatus = "User Won";
                            break;
                        case 2:
                            betStatus = "User Lost";
                            break;
                    }
                    setBetResult(betResultJson)

                } catch (e) {
                    console.log("fetch result error", e)
                }
            }
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [wallet, provider, program, pda, betResult]);

    const onClick = async (side: number) => {
        setResultJson("");
        setResult(undefined);
        setBetResult(undefined);
        setPDA(undefined);

        const ref = new anchor.web3.Keypair()
        if (!program || !provider || !flipCoin) {
            return
        }

        let [
            stateSigner,
            _,
        ] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
            program.programId);

        let [
            vaultSigner,
            nonce,
        ] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("request-reference-seed")), ref.publicKey.toBuffer()],
            program.programId
        );

        let [
            betSigner,
            betNonce,
        ] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("bet")), ref.publicKey.toBuffer()],
            flipCoin.programId
        );


        console.log("prepare to make request")
        try {
            await flipCoin.rpc.flip(nonce, betNonce, side, {
                accounts: {
                    bet: betSigner,
                    solanaAnchorRandoProgram: program.programId,
                    requester: program.provider.wallet.publicKey,
                    requestReference: ref.publicKey,
                    vault: vaultSigner,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId
                }
            })
        } catch (e) {
            return
        }
        setPDA({
            pda: vaultSigner.toString(),
            betPDA: betSigner.toString()
        })
        console.log("made request...", betSigner.toString())
    };



    const pdaUrl = pda === undefined ? '' : `https://explorer.solana.com/address/${pda.pda}?cluster=devnet`
    const flipCoinPDAUrl = pda === undefined ? '' : `https://explorer.solana.com/address/${pda.betPDA}?cluster=devnet`

    // @ts-ignore
    // @ts-ignore
    return (
        <main>
            {wallet && (
                <p>Address: {wallet.publicKey.toBase58() || ""}</p>
            )}

            {wallet && (
                <div>
                <p>Balance: {(balance || 0).toLocaleString()} SOL</p>
                <p> Devnet SOL Faucet: <a target="_blank" href={"https://solfaucet.com/" }>here </a></p>
                </div>
            )}

            <MintContainer>
                {!wallet ? (
                    <ConnectButton>Connect Wallet</ConnectButton>
                ) : (
                    <div>
                        <MintButton
                        onClick={() => onClick(0)}
                    >Bet Head</MintButton>
                        <MintButton
                            onClick={() => onClick(1)}
                        >Bet Tail</MintButton>

                    </div>)}


                {pda ? (
                    <div>
                        <p>Bet PDA: <a target="_blank"  href={flipCoinPDAUrl}>{pda.betPDA}</a></p>
                        <p>Rando PDA: <a target="_blank"  href={pdaUrl}>{pda.pda}</a></p>
                        <p>Bet result: {betResult ? JSON.stringify({
                            "User bet side": betResult.side === 0 ? 'Head' : 'Tail',
                            "Bet Status": betResult.status === 0 ? 'Pending...' : (betResult.status === 1 ? 'User Won' : 'User Lost'),
                            "Bet's rando Vault": betResult.vault
                        }, null, 2) : "Pending..."}</p>

                        <p>Rando number result: {result ? result : "Pending..."}</p>
                        <p>Coin flip result: {(result && result!=='0') ? (new anchor.BN(result.substr(-1)).toNumber() % 2 === 0 ? "Head" : "Tail") : "Pending..."}</p>
                    </div>
                ) : (<div/>)}

                {resultJson ? (
                    <div>
                        <p>Rando number PDA raw content:</p>
                        <p>{resultJson}</p>
                    </div>
                ) : (<div/>)}

            </MintContainer>

        </main>
    );
};

export default Home;
