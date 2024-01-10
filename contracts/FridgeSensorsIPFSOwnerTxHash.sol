// SPDX-License-Identifier: MIT LICENSE

pragma solidity 0.8.19;

contract FridgeIPFSOwnerTxHash {
    struct SensorData {
        uint256 timestamp;
        string ipfsHash;
        string txHash;
    }

    struct Data {
        uint256 fridge_id;
        address uploader;
        string ipfsHash;
        string txHash;
    }

    mapping(address => mapping(uint256 => SensorData[])) public fridgesByUploader;

    event DataSaved(address indexed uploader, uint256 indexed fridge_id, string ipfsHash);

    function saveDataBatch(Data[] calldata data) external {
        for (uint256 i = 0; i < data.length; i++) {
            SensorData memory newData;
            newData.timestamp = block.timestamp;
            newData.ipfsHash = data[i].ipfsHash;
            newData.txHash = data[i].txHash;

            fridgesByUploader[data[i].uploader][data[i].fridge_id].push(newData);

            emit DataSaved(data[i].uploader, data[i].fridge_id, data[i].ipfsHash);
        }
    }

    function getAllDataByMultipleUploaders(
    address[] calldata uploaders,
    uint256 fridge_id
    ) external view returns (SensorData[] memory) {
    SensorData[] memory result;
    for (uint256 i = 0; i < uploaders.length; i++) {
    SensorData[] memory data = fridgesByUploader[uploaders[i]][fridge_id];
    result = concat(result, data);
    }
    return result;
    }

    function concat(SensorData[] memory a, SensorData[] memory b) internal pure returns (SensorData[] memory) {
    SensorData[] memory result = new SensorData[](a.length + b.length);
    for (uint256 i = 0; i < a.length; i++) {
    result[i] = a[i];
    }
    for (uint256 i = 0; i < b.length; i++) {
    result[a.length + i] = b[i];
    }
    return result;
    }
}