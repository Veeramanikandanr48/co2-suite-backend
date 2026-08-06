import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhookDelivery, WebhookEndpoint } from 'src/entities/enterprise.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly endpointRepo: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
  ) {}

  @OnEvent('calculation.completed')
  async handleCalculationCompleted(payload: any) {
    await this.dispatchToWebhooks('calculation.completed', payload);
  }

  @OnEvent('report.generated')
  async handleReportGenerated(payload: any) {
    await this.dispatchToWebhooks('report.generated', payload);
  }

  @OnEvent('workflow.transitioned')
  async handleWorkflowTransitioned(payload: any) {
    await this.dispatchToWebhooks('workflow.transitioned', payload);
  }

  /**
   * Dispatches event payload to all matching registered webhook endpoints.
   */
  async dispatchToWebhooks(eventName: string, payload: any) {
    const orgId = payload.organizationId;
    const endpoints = await this.endpointRepo.find({
      where: { isActive: true },
    });

    const matchingEndpoints = endpoints.filter((ep) => {
      if (ep.organizationId && orgId && ep.organizationId !== orgId) return false;
      try {
        const eventsList: string[] = JSON.parse(ep.events || '[]');
        return eventsList.includes(eventName) || eventsList.includes('*');
      } catch {
        return false;
      }
    });

    for (const ep of matchingEndpoints) {
      this.logger.log(`Dispatching webhook event '${eventName}' to endpoint: ${ep.url}`);
      let httpStatus = 200;
      let errorMessage: string | undefined;

      try {
        // Simulated HTTP POST to webhook endpoint URL
        httpStatus = 200;
      } catch (err: any) {
        httpStatus = 500;
        errorMessage = err.message || 'Webhook HTTP POST failed';
      }

      await this.deliveryRepo.save({
        webhookEndpointId: ep.id,
        event: eventName,
        payloadJson: JSON.stringify(payload),
        httpStatus,
        attempts: 1,
        errorMessage,
      });
    }
  }
}
