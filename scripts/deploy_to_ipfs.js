const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const recursive = require('recursive-fs');
const basePathConverter = require('base-path-converter');

require('dotenv').config()

const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
const project_prefix = './dogshitnfts';

let images_hash;

// deploy images first to get the ipfs hash
startDeploy = () => {
    const images_dir = project_prefix + '_images';
    let imageCount = 0;

    //we gather the files from a local directory in this example, but a valid readStream is all that's needed for each file in the directory.
    recursive.readdirr(images_dir, function (err, dirs, files) {
        let data = new FormData();
        files.forEach((file) => {
            imageCount++;
            //for each file stream, we need to include the correct relative file path
            data.append(`file`, fs.createReadStream(file), {
                filepath: basePathConverter(images_dir, file)
            })
        });

        return axios.post(url,
            data,
            {
		maxBodyLength: 'Infinity',
                maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
                }
            }
        ).then(function (response) {
            //handle response here
            images_hash = response.data.IpfsHash;

            console.log("image count: " + imageCount);
            console.log("image hash : " + images_hash);

            // deployMetadata();

        }).catch(function (error) {
            //handle error here
            console.log("Error ---");
            console.log(error);
        });
    });    
};

deployMetadata = () => {
    const metadata_dir = project_prefix + '_meta';
    const gateway_url = "ipfs://" + images_hash;

    let data = new FormData();
    recursive.readdirr(metadata_dir, function (err, dirs, files) {
        files.forEach((file) => {
            fs.readFile(file, 'utf8', function(err, content) {
                if (err) throw err;

                const metadata = JSON.parse(content);
                if (!metadata.image) return;

                metadata.image = gateway_url + "/" + metadata.image;
                metadata.external_url = metadata.image;
                console.log("processing meta:", metadata.image);
                const st = JSON.stringify(metadata, null, 2);
                (async () => {
                    await fs.writeFileSync(file, st);

                    //for each file stream, we need to include the correct relative file path
                    data.append(`file`, st, {
                        filepath: basePathConverter(metadata_dir, file)
                    })
                })();
            });
        });
    });

   //we gather the files from a local directory in this example, but a valid readStream is all that's needed for each file in the directory.
    recursive.readdirr(metadata_dir, function (err, dirs, files) {

        // files.forEach((file) => {
        //
        // });

        return axios.post(url,
            data,
            {
        	maxBodyLength: 'Infinity',
                maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
                }
            }
        ).then(function (response) {
            //handle response here
            metadata_hash = response.data.IpfsHash;

            console.log("token hash : " + metadata_hash);

            // deployContractUri();

        }).catch(function (error) {
            //handle error here
            console.log("Error ---");
            console.log(error);
        });
    });
}

// deployContractUri = () => {
//     const contractUriFile = temp_metadata_dir + '/contracturi.json';
//     const gateway_url = "https://gateway.pinata.cloud/ipfs/" + images_hash;
//
//     // read contractUri
//     let contractUri = require(metadata_file).contractUri;
//
//     // append image with gateway_url
//     contractUri.image = gateway_url + "/" + contractUri.image;
//
//     const st = JSON.stringify(contractUri, null, 2);
//     fs.writeFileSync(contractUriFile, st);
//
//     let data = new FormData();
//     data.append(`file`, fs.createReadStream(contractUriFile));
//
//
//     return axios.post(url,
//         data,
//         {
//             maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
//             headers: {
//                 'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
//                 'pinata_api_key': process.env.PINATA_API_KEY,
//                 'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
//             }
//         }
//     ).then(function (response) {
//         //handle response here
//         contractUri_hash = response.data.IpfsHash;
//
//         console.log("-----Contract Uri -----");
//         console.log(st);
//         console.log("-----------------------")
//         console.log("contract URI hash : " + contractUri_hash);
//
//         saveConfigFile();
//
//     }).catch(function (error) {
//         //handle error here
//         console.log("Error ---");
//         console.log(error);
//     });
//
// }


// saveConfigFile = () => {
//     const config_file = temp_metadata_dir + "/erc1155config.json";
//
//     const metadata_config = {
//         "gatewayUrl": "https://gateway.pinata.cloud/ipfs",
//         "metadataHash": metadata_hash,
//         "imagesHash": images_hash,
//         "contractUriHash": contractUri_hash
//     }
//
//     const st = JSON.stringify(metadata_config, null, 2);
//     fs.writeFileSync(config_file, st);
// }

startDeploy();
