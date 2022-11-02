import {
  AuthProvider,
  OreId,
  Transaction,
  UserData,
} from "oreid-js";
import LoginButton from "oreid-login-button";
// ! To use hooks from oreid-react make sure you added the OreidProvider (index.tx shows how to do this)
import { OreidProvider, useIsLoggedIn, useOreId, useUser } from "oreid-react";
import { WebPopup } from "oreid-webpopup";
import React, { useEffect, useState } from "react";
import { act } from "react-dom/test-utils";
import "./App.css";

const REACT_APP_OREID_APP_ID = "t_c329e3c944d449eba0eac10c1cc06484";
// const REACT_APP_OREID_API_KEY = "demo_k_97b33a2f8c984fb5b119567ca19e4a49";

// * Initialize OreId
const oreId = new OreId({
  appName: "ORE ID Sample App",
  appId: REACT_APP_OREID_APP_ID,
  // apiKey: REACT_APP_OREID_API_KEY, // apiKey required for autoSign feature
  plugins: {
    popup: WebPopup(),
  },
  oreIdUrl: "http://localhost:8080"
});

const createSampleTransactionGoerli = (actor: string, permission = "app1tinmotqi") => {

  const erc1155Abi: any[] = [
    {
        "inputs":
        [
            {
                "internalType": "address",
                "name": "_from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            }
        ],
        "name": "safeTransferFrom",
        "outputs":
        [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
  ]

  let b : any = []
  var erc1155_Contract_Address = "0xf4910c763ed4e47a585e2d34baa9a4b611ae448c";
  var nft_recipient_Address = "0x60d5DA4FC785Dd1dA9c2dAF084B2D5ba478c8f8b";
  var tokenId = "43799878620342970581926639484176058944731643284697752016825318575943809236993";

  const transaction = 
  {
    "from": actor,
    "to": erc1155_Contract_Address,
    "contract":
    {
        "abi": erc1155Abi,
        "method": "safeTransferFrom",
        "parameters":
        [
            actor,
            nft_recipient_Address,
            tokenId,
            1,
            b
        ]
    }
  };

  return transaction;
};

const composeSampleTransaction: any = async (
  userData: UserData,
  signWithChainNetwork: string
) => {
  if (!userData) return null;

  const signingAccount = userData.chainAccounts.find(
    (ca) => ca.chainNetwork === signWithChainNetwork
  );
  if (!signingAccount)
    throw new Error(
      `User doesnt have a chain account for the ${signWithChainNetwork} network`
    );

  // Compose transaction contents
  const transactionBody = createSampleTransactionGoerli(
    signingAccount.chainAccount,
    signingAccount.defaultPermission?.name
  );
  const transaction = await oreId.createTransaction({
    chainAccount: signingAccount.chainAccount,
    chainNetwork: signingAccount.chainNetwork,
    transaction: transactionBody,
    signOptions: {
      broadcast: true,
      returnSignedTransaction: false,
    },
  });
  return transaction;
};

const NotLoggedInView: React.FC = () => {
  const oreId = useOreId();
  const [error, setError] = useState<string>();

  const onError = (error: Error) => {
    console.log("Login failed:", error.message);
    setError(error.message);
  };

  const onSuccess = ({ user }: { user: UserData }) => {
    console.log("Login successfull");
    console.log("User Data: ", user);
  };

  const loginWithOreidPopup = (provider: AuthProvider) => {
    // launch popup for user to login
    oreId.popup.auth({ provider }).then(onSuccess).catch(onError);
  };

  return (
    <>
      <div>
        <LoginButton
          provider="facebook"
          onClick={() => loginWithOreidPopup(AuthProvider.Facebook)}
        />
        <LoginButton
          provider="google"
          onClick={() => loginWithOreidPopup(AuthProvider.Google)}
        />
        <LoginButton
          provider="email"
          onClick={() => loginWithOreidPopup(AuthProvider.Email)}
        />
      </div>
      {error && <div className="App-error">Error: {error}</div>}
    </>
  );
};

const LoggedInView: React.FC = () => {
  const user = useUser();
  const oreId = useOreId();

  const [error, setError] = useState<string>();
  const [signResults, setSignResults] = useState<any | undefined>();

  if (!user) return null;

  const { accountName, email, name, picture, username } = user;

  const onError = (error: Error) => {
    setError(error.message);
  };
  const onSuccess = (results: any) => {
    setSignResults(results);
  };

  return (
    <>
      <div style={{ marginTop: 50, marginLeft: 40 }}>
        <h4>This demo requires oreid-service to be running on http://localhost:8080</h4>
        <h4>Mode: Dev</h4>
        <h4>Using AppId: t_c329e3c944d449eba0eac10c1cc06484</h4>
        <h4>Blockchain: Goerli Testnet</h4>
        <img
          src={picture.toString()}
          style={{ width: 100, height: 100, paddingBottom: 30 }}
          alt={"user"}
        />
        <br />
        OreId account: {accountName}
        <br />
        name: {name}
        <br />
        username: {username}
        <br />
        email: {email}
        <br />
        <LoginButton
          provider="oreid"
          text="Sign with OreID"
          onClick={() => {
            setError(undefined);
            // compose a sample transaction for the EOS Kylin test network
            composeSampleTransaction(user, "eth_goerli").then(
              (transaction: Transaction) => {
                console.log("transaction to sign:", transaction.data);
                // call the sign action
                oreId.popup
                  .sign({
                    transaction,
                  })
                  .then(onSuccess)
                  .catch(onError);
              }
            );
          }}
        />
        <button onClick={() => oreId.logout()}>Logout</button>
      </div>
      {signResults && (
        <div className="App-success">
          Results: {JSON.stringify(signResults)}
        </div>
      )}
      {error && <div className="App-error">Error: {error}</div>}
    </>
  );
};

const AppWithProvider: React.FC = () => {
  const isLoggedIn = useIsLoggedIn();
  return (
    <div className="App">
      <header className="App-header">
        {isLoggedIn ? <LoggedInView /> : <NotLoggedInView />}
      </header>
    </div>
  );
};

export const App: React.FC = () => {
  const [oreidReady, setOreidReady] = useState(false);

  useEffect(() => {
    oreId.init().then(() => {
      setOreidReady(true);
    });
  });

  if (!oreidReady) {
    return <>Loading...</>;
  }

  return (
    <OreidProvider oreId={oreId}>
      <AppWithProvider />
    </OreidProvider>
  );
};
