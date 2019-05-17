pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';
//import 'github.com/OpenZeppelin/zeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

    // Note: I did some research and noticed that actually RA and DEC identify a star coordinate.
    // CENT would indicate the constellation Centaurus (which is optional regarding coordinates, so I replaced that attribute by the RA). 
    // The magnitude is not actually a coordinate, it's about the intensity of the star and maybe it could be declared outside this struct.
    // But, for simplicity and since the specification is confusing on this, I'm assuming that RA, DEC and MAG identify uniquely a star coordinate, 
    // and assume that those values are strings, because solidity does not fully support float/decimal types yet.
    struct Coordinates {
        string ra;   // right ascension
        string dec;  // declination
        string mag;  // magnitude
    }

    struct Star { 
        string name; 
        string story;
        Coordinates coordinates;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    mapping(bytes32 => bool) internal coordinatesAlreadyExist;
    uint256[] public allStarsForSale;

    function createStar(string _name, string _story, string _ra, string _dec, string _mag, uint256 _tokenId) public { 
        require(_tokenId > 0, 'id is required');
        require(bytes(_name).length > 0, 'name is required');
        require(bytes(_ra).length > 0, 'right ascension is required');
        require(bytes(_dec).length > 0, 'declination is required');
        require(bytes(_mag).length > 0, 'magnitude is required');
        bool starExists = checkIfStarExist(_tokenId);
        require(!starExists, 'star id already exists');
        bool isUnique = checkIfUnique(_ra, _dec, _mag);
        require(isUnique, 'another star already has these coordinates');
        Coordinates memory coord = Coordinates(_ra, _dec, _mag);
        Star memory newStar = Star(_name, _story, coord);
        tokenIdToStarInfo[_tokenId] = newStar;
        coordinatesAlreadyExist[keccak256(abi.encodePacked(_ra, _dec, _mag))] = true;
        _mint(msg.sender, _tokenId);
    }

    function checkIfUnique(string _ra, string _dec, string _mag) public view returns(bool) {
        return (!coordinatesAlreadyExist[keccak256(abi.encodePacked(_ra, _dec, _mag))]);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(ownerOf(_tokenId) == msg.sender, 'only the owner can put a star up for sale');

        starsForSale[_tokenId] = _price;
        allStarsForSale.push(_tokenId);
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0, 'that star is not for sale');
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost, 'not enough funds to buy the star');

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }

        removeStarForSale(_tokenId);
    }

    function removeStarForSale(uint256 _tokenId) internal {
        starsForSale[_tokenId] = 0;
        for (uint i=0; i < allStarsForSale.length; i++) {
            if (allStarsForSale[i] == _tokenId) {
                allStarsForSale[i] = allStarsForSale[allStarsForSale.length-1];
                allStarsForSale.length--;
                break;
            }
        }
    }

    function checkIfStarExist(uint256 _tokenId) public view returns(bool) {
        return _exists(_tokenId);
    } 
    
    function tokenIdToStarInfo(uint256 _tokenId) public view returns(string, string, string, string, string) {
        Star memory star = tokenIdToStarInfo[_tokenId];
        return (star.name, star.story, star.coordinates.ra, star.coordinates.dec, star.coordinates.mag);
    }

    function allStarsForSale() public view returns(uint256[]) {
        return allStarsForSale;
    }
}