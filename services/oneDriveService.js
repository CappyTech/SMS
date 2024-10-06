const axios = require('axios');
const qs = require('querystring');
const logger = require('../logger');
const Drive = require('../models/drive'); // Assuming you have a Sequelize model for storing files

/**
 * Retrieves an access token from Azure AD using client credentials.
 * 
 * @returns {Promise<string>} - The access token.
 * @throws {Error} - Throws an error if the access token cannot be obtained.
 */
async function getAccessToken() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = {
        client_id: clientId,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    };

    try {
        const response = await axios.post(tokenUrl, qs.stringify(params), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = response.data.access_token;
        logger.info('Access token obtained');
        return accessToken;
    } catch (error) {
        logger.error('Error fetching access token: ' + error);
        throw new Error('Access token not obtained');
    }
}

/**
 * Fetches files from OneDrive using Microsoft Graph API.
 * 
 * @returns {Promise<Array>} - An array of files from OneDrive.
 * @throws {Error} - Throws an error if the files cannot be fetched.
 */
async function fetchOneDriveFiles() {
    try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
            logger.error('Access token not obtained');
            throw new Error('Access token not obtained'); // Rethrow to ensure the failure propagates.
        }

        const oneDriveUrl = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
        const response = await axios.get(oneDriveUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });

        const files = response.data.value;
        logger.info('Fetched files:', files);
        return files;
    } catch (error) {
        logger.error('Error fetching OneDrive files: ' + error.message);
        throw new Error('Failed to fetch OneDrive files');  // Rethrow for better control upstream
    }
}

/**
 * Saves or updates files in the database.
 * 
 * @param {Array} files - An array of files to save or update in the database.
 */
async function saveFilesToDatabase(files) {
    for (const file of files) {
        try {
            const existingFile = await Drive.findOne({ where: { itemId: file.id } });

            if (existingFile) {
                await existingFile.update({
                    name: file.name,
                    size: file.size,
                    mimeType: file.file ? file.file.mimeType : null,
                    fileType: file.file ? file.file.fileType : null,
                    createdDateTime: file.createdDateTime,
                    lastModifiedDateTime: file.lastModifiedDateTime,
                    parentPath: file.parentReference ? file.parentReference.path : null,
                    downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
                });
                logger.info(`Updated file: ${file.name}`);
            } else {
                await Drive.create({
                    itemId: file.id,
                    name: file.name,
                    size: file.size,
                    mimeType: file.file ? file.file.mimeType : null,
                    fileType: file.file ? file.file.fileType : null,
                    createdDateTime: file.createdDateTime,
                    lastModifiedDateTime: file.lastModifiedDateTime,
                    parentPath: file.parentReference ? file.parentReference.path : null,
                    downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
                });
                logger.info(`Created file: ${file.name}`);
            }
        } catch (error) {
            logger.error('Error saving or updating file to the database:' + error);
        }
    }
}

/**
 * Synchronizes OneDrive files to the database.
 * Fetches files from OneDrive and saves or updates them in the database.
 */
async function syncOneDriveToDatabase() {
    try {
        const files = await fetchOneDriveFiles();
        if (files && files.length > 0) {
            await saveFilesToDatabase(files);
        }
    } catch (error) {
        logger.error('Error syncing OneDrive to database: ' + error.message);
    }
}

module.exports = {
    getAccessToken,
    fetchOneDriveFiles,
    saveFilesToDatabase,
    syncOneDriveToDatabase,
};