// SPDX-License-Identifier: MIT LICENSE

pragma solidity 0.8.19;

contract FridgeStringID {
    struct Data {
        uint256 timestamp;
        string ipfsHash;
        string txHash;
    }

    struct SensorData {
        string fridge_id;
        uint256 timestamp;
        address uploader;
        string ipfsHash;
        string txHash;
    }

    mapping(address => mapping(string => Data[])) public fridgesByUploader;

    function saveDataBatch(SensorData[] calldata data) external {
        for (uint256 i = 0; i < data.length; i++) {
            Data memory newData;
            newData.timestamp = data[i].timestamp;
            newData.ipfsHash = data[i].ipfsHash;
            newData.txHash = data[i].txHash;

            fridgesByUploader[data[i].uploader][data[i].fridge_id].push(newData);
        }
    }

    function getAllDataByMultipleUploaders(
    address[] calldata uploaders,
    string memory fridge_id
    ) external view returns (Data[] memory) {
    Data[] memory result;
    for (uint256 i = 0; i < uploaders.length; i++) {
    Data[] memory data = fridgesByUploader[uploaders[i]][fridge_id];
    result = concat(result, data);
    }
    return result;
    }

    function concat(Data[] memory a, Data[] memory b) internal pure returns (Data[] memory) {
    Data[] memory result = new Data[](a.length + b.length);
    for (uint256 i = 0; i < a.length; i++) {
    result[i] = a[i];
    }
    for (uint256 i = 0; i < b.length; i++) {
    result[a.length + i] = b[i];
    }
    return result;
    }
}