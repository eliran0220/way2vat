import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv'; 
dotenv.config();

class S3Service {
    constructor() {
        this.s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY
            }
        });
    }

    getFileFromS3 = async (bucketName, key) =>{
        const params = { Bucket: bucketName, Key: key };
        try {
            const response = await this.s3.send(new GetObjectCommand(params));
            return response.Body;
        } catch (error) {
            console.error("Error fetching file from S3:", error);
            throw error;
        }
    }

     isFileExistsInS3 = async (bucketName, key) => {
        const params = { Bucket: bucketName, Key: key };
        try {
            await this.s3.send(new HeadObjectCommand(params));
            return true;
        } catch (error) {
            if (error.name === "NotFound") {
                return false; 
            }
            console.error("Error checking file existence in S3:", error);
            throw error;
        }
     }
}

export default new S3Service();