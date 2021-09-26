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

const MintButton = styled(Button)`{background-color: #008CBA;}`; // add your styles here

export interface HomeProps {
    connection: anchor.web3.Connection;
    txTimeout: number;
}

export interface RandoPDA {
    transaction: Array<number>,
    requestId: Array<number>,
    result: Array<number>
    nonce: number
}


const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [provider, setProvider] = useState<Provider>();
    const [program, setProgram] = useState<Program>();
    const [pda, setPDA] = useState<string>();
    const [requestId, setRequestId] = useState<string>();
    const [polygonTransaction, setPolygonTransaction] = useState<string>();
    const [result, setResult] = useState<string>();
    const [resultJson, setResultJson] = useState<string>();
    const wallet = useAnchorWallet();

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
                const provider = new anchor.Provider(props.connection, wallet as anchor.Wallet, Provider.defaultOptions());
                const program = await anchor.Program.at('JDZWD3avGqpj5sypqoM9NHiCNrQPLtzgfjq2cduPGtkH', provider)
                setProvider(provider)
                setProgram(program)
            }
        })();
    }, [wallet, props.connection]);

    useEffect(() => {
        if (resultJson) {
            return
        }
        const interval = setInterval(async () => {
            if (program && pda && provider) {
                try {
                    const resultJson = await program.account.randoResult.fetch(pda.toString()) as RandoPDA
                    setResultJson(JSON.stringify(resultJson, null, 2))

                    // transaction, requestId, result are all [u8;64]
                    const transactionBN = new anchor.BN(Buffer.from(resultJson.transaction).toString(), 16)
                    if (transactionBN.gt(new anchor.BN(0))) {
                        setPolygonTransaction('0x' + transactionBN.toString(16))
                    }

                    const requestIdBN = new anchor.BN(Buffer.from(resultJson.requestId).toString(), 16)
                    if (requestIdBN.gt(new anchor.BN(0))) {
                        setRequestId('0x' + requestIdBN.toString(16))
                    }

                    const resultBN = new anchor.BN(Buffer.from(resultJson.result).toString(), 16)
                    if (resultBN.gt(new anchor.BN(0))) {
                        setResult(resultBN.toString())
                    }
                } catch (e) {
                }
            }
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [wallet, provider, program, pda]);

    const onClick = async () => {

        const ref = new anchor.web3.Keypair()
        if (!program || !provider) {
            return
        }

        setResultJson("");
        setResult(undefined);
        setPDA(undefined);
        setRequestId(undefined);
        setPolygonTransaction(undefined);
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

        console.log("prepare to make request")
        await program.rpc.request(nonce, {
            accounts: {
                requester: provider.wallet.publicKey,
                requestReference: ref.publicKey,
                vault: vaultSigner,
                state: stateSigner,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId
            }
        });
        setPDA(vaultSigner.toString())

        /*

        Event listener is for some reason not very reliable...

        await program.addEventListener("FilledTransactionEvent", async (event, slot) => {
            if (event.requestReference.toString() === pda) {
                setRequestId(new anchor.BN(Buffer.from(event.requestId).toString(), 16).toString(16))
                setPolygonTransaction(new anchor.BN(Buffer.from(event.transaction).toString(), 16).toString(16))
            }
        })
        await program.addEventListener("FilledResultEvent", async (event, slot) => {
            if (event.requestReference.toString() === pda) {
                console.log("FilledResultEvent")
                setResult(new anchor.BN(Buffer.from(event.result).toString(), 16).toString())
                const resultJson = await program.account.randoResult.fetch(vaultSigner.toString())
                setResultJson(JSON.stringify(resultJson, null, 2))
            }
        })
        */
        console.log("made request...")
    };

    const requestMadeUrl = `https://explorer.solana.com/address/${pda}?cluster=devnet`
    const polygonTransactionURL = `https://mumbai.polygonscan.com/tx/${polygonTransaction}`

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
                        onClick={onClick}
                    >GET RANDOM</MintButton>

                    </div>)}


                {pda ? (
                    <div>
                        <p>Rando PDA: <a target="_blank"  href={requestMadeUrl}>{pda}</a></p>
                        <p>Rando result should show up in ~20 seoncds, please do not refresh..</p>
                        <p>Poloygon Request Random Transaction: <a target="_blank"  href={polygonTransactionURL}>{polygonTransaction}</a></p>
                        <p>Chainlink VRF Request ID: {requestId}</p>
                        <p>Rando number result: {result}</p>
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
