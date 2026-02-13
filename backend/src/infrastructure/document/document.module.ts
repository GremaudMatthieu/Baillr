import { Global, Module } from '@nestjs/common';
import { PdfGeneratorService } from './pdf-generator.service.js';

@Global()
@Module({
  providers: [PdfGeneratorService],
  exports: [PdfGeneratorService],
})
export class DocumentModule {}
