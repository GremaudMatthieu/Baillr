import { Global, Module } from '@nestjs/common';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { ExcelGeneratorService } from './excel-generator.service.js';

@Global()
@Module({
  providers: [PdfGeneratorService, ExcelGeneratorService],
  exports: [PdfGeneratorService, ExcelGeneratorService],
})
export class DocumentModule {}
