import Q = require('q');
import fs = require('fs');
import { IWebAppDeploymentHelper } from './IWebAppDeploymentHelper';
import { TaskParameters } from '../taskparameters';
import { KuduServiceUtility } from '../common/RestUtilities/KuduServiceUtility';
import { Kudu } from '../common/KuduRest/azure-app-kudu-service';
import * as core from '@actions/core';

var parseString = require('xml2js').parseString;

interface scmCredentials {
    uri: string;
    username: string;
    password: string;
}

export class PublishProfileBasedDeploymentHelper implements IWebAppDeploymentHelper {
    private kuduService: Kudu;
    private kuduServiceUtility: KuduServiceUtility;
    private activeDeploymentID;
    private applicationURL: string;

    public get KuduServiceUtility(): KuduServiceUtility {
        return this.kuduServiceUtility;
    }

    public get ActiveDeploymentID() {
         return this.activeDeploymentID;
    }

    public async PreDeploymentStep() {
        let scmCreds: scmCredentials = await this.getCredsFromXml(TaskParameters.getTaskParams().publishProfilePath);
        this.kuduService = new Kudu(scmCreds.uri, scmCreds.username, scmCreds.password);
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean, updateStatus: boolean) {
        if(this.kuduServiceUtility) {
            if(!!updateStatus && updateStatus == true) {
                // can pass slotName: this.appService.getSlot() in  custom message
                this.activeDeploymentID = await this.kuduServiceUtility.updateDeploymentStatus(isDeploymentSuccess, null, {'type': 'Deployment'});
                core.debug('Active DeploymentId :'+ this.activeDeploymentID);
            }
        }
        
        console.log('App Service Application URL: ' + this.applicationURL);
        core.exportVariable('AppServiceApplicationUrl', this.applicationURL);
    }

    private async getCredsFromXml(pubxmlFile: string): Promise<scmCredentials> {
        var publishProfileXML = fs.readFileSync(pubxmlFile);
        let res;
        await parseString(publishProfileXML, (error, result) => {
            if(!!error) {
                throw new Error("Failed XML parsing " + error);
            }
            res = result.publishData.publishProfile[0].$;
        });
        let creds: scmCredentials = {
            uri: res.publishUrl.split(":")[0],
            username: res.userName,
            password: res.userPWD
        };
        if(creds.uri.indexOf("scm") < 0) {
            throw new Error("Publish profile does not contain kudu URL");
        }
        this.applicationURL = res.destinationAppUrl;
        return creds;
    }
}