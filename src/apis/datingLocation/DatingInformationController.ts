import { Controller, Inject } from "@tsed/di";
import { Res } from "@tsed/common";
import { Get, Post, Returns, Summary, Description } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { DatingInformationService } from "./services/DatingInformationService";
import { CreateDatingLocation } from "./dto/CreateDatingLocation";
@Controller("/datingInformation")
export class DatingInformationController {

    @Inject(DatingInformationService)
    private readonly datingInformationService: DatingInformationService;

    @Post("/create-dating-location")
    @Summary("Create dating location")
    @Description("Creates dating location")
    @Returns(201, String)
    @Returns(400, String)
    async createDatingLocation(
        @BodyParams("datingInformation") datingInformation: CreateDatingLocation,
        @Res() res: Res
    ): Promise<void> {
        try {
            const result = await this.datingInformationService.createDatingLocation(datingInformation);
            console.log(result);
            if (result) {
            res.status(201).send({ message: 'Dating location created successfully' });
        } else {
            res.status(400).send({ message: 'Dating location creation failed' });
        }
        } catch (error) {
        res.status(500).send({ message: 'Internal server error', error: error.message });
        }
  }
    

}