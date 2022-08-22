import { GasToken, EvmChain } from "@axelar-network/axelarjs-sdk";

export enum Network {
    'ethereum', 'ropsten',
    'moonbeam', 'moonbase',
    'polygon', 'mumbai',
    'avalanche', 'fuji',
    'fantom',
    'bnb',
    'aurora'
};

// Gets the gateway & gasReceiver address for our network
export function getGatewayAddress(network: Network | number) {
    switch (network) {
        case 1: case 3: case Network.ethereum: case Network.ropsten: return '0xBC6fcce7c5487d43830a219CA6E7B83238B41e71';
        case 1284: case 1287: case Network.moonbeam: case Network.moonbase: return '0x5769D84DD62a6fD969856c75c7D321b84d455929';
        case Network.polygon: case Network.mumbai: return '0xBF62ef1486468a6bd26Dd669C06db43dEd5B849B';
        case Network.avalanche: case Network.fuji: return '0xC249632c2D40b9001FE907806902f63038B737Ab';
        case Network.fantom: return '0x97837985Ec0494E7b9C71f5D3f9250188477ae14';
        case Network.bnb: return '0x4D147dCb984e6affEEC47e44293DA442580A3Ec0';
        case Network.aurora: return '0x304acf330bbE08d1e512eefaa92F6a57871fD895';
        default: throw new Error('Not allowed!');
    }
}
export const getWDEVAddress = (network: Network | number) => {
    switch (network) {
        case 1: case 3: case Network.ethereum: case Network.ropsten: return '0xDc6B192eFa7eBab24063e20c962E74C88A012D3c';
        case 1284: case 1287: case Network.moonbeam: case Network.moonbase: return '0x1436aE0dF0A8663F18c0Ec51d7e2E46591730715';
        case 137: case 80001: case Network.polygon: case Network.mumbai: return '0xb6a2f51C219A66866263Cb18DD41EE6C51B464cB';
        case 43114: case 43113: case Network.avalanche: case Network.fuji: return '0xF58537d9061f7257e44442Fb7870A094AAE92B43';
        case 250: case 4002: case Network.fantom: return '0xD6f858A1E75e9a06c42dcd86BB876C5E9FccA572';
        case 56: case 97: case Network.bnb: return '0xa893Fd868c3159B294f6416F512203be53315fd8';
        case 1313161554: case 1313161555: case Network.aurora: return '0xC43178D657171A831d826f01ECa657c9439457c6';
        default: throw new Error('Not allowed!');
    }
}
export const getUSDCAddress = (network: Network | number) => {
    switch (network) {
        case 1: case 3: case Network.ethereum: case Network.ropsten: return '0x526f0A95EDC3DF4CBDB7bb37d4F7Ed451dB8e369';
        case 1284: case 1287: case Network.moonbeam: case Network.moonbase: return '0xD1633F7Fb3d716643125d6415d4177bC36b7186b';
        case 137: case 80001: case Network.polygon: case Network.mumbai: return '0x2c852e740B62308c46DD29B982FBb650D063Bd07';
        case 43114: case 43113: case Network.avalanche: case Network.fuji: return '0x57F1c63497AEe0bE305B8852b354CEc793da43bB';
        case 250: case 4002: case Network.fantom: return '0x75Cc4fDf1ee3E781C1A3Ee9151D5c6Ce34Cf5C61';
        case 56: case 97: case Network.bnb: return '0xc2fA98faB811B785b81c64Ac875b31CC9E40F9D2';
        case 1313161554: case 1313161555: case Network.aurora: return '0xFfB4749710EC6286b3A0dC2F24165DA622dA2ff5';
        default: throw new Error('Not allowed!');
    }
}
export const tokenName = (network: Network | number) => {
    switch(network) {
        case 1: case 3: case Network.ropsten: case Network.ethereum: return GasToken.ETH;
        case 1284: case 1287: case Network.moonbase: case Network.moonbeam: return GasToken.GLMR;
        case 137: case 80001: case Network.mumbai: case Network.polygon: return GasToken.MATIC;
        case 43114: case 43113: case Network.fuji: case Network.avalanche: return GasToken.AVAX;
        case 250: case 4002: case Network.fantom: return GasToken.FTM;
        default: throw new Error('Not allowed!');
    }
}
export const testnetToMainnetChainName = (network: Network | number) => {
    switch (network) {
        case 3: case Network.ropsten: return EvmChain.ETHEREUM;
        case 1284: case 1287: case Network.moonbase: return EvmChain.MOONBEAM;
        case 137: case 80001: case Network.mumbai: return EvmChain.POLYGON;
        case 43114: case 43113: case Network.fuji: return EvmChain.AVALANCHE;
        case 250: case 4002: case Network.fantom: return EvmChain.FANTOM;
        default: throw new Error('Not allowed!');
    }
};
export const gasReceiverAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
