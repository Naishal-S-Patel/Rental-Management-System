package com.hackathon.starter.service;

import com.hackathon.starter.entity.QuotationTemplate;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.QuotationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuotationTemplateService {

    private final QuotationTemplateRepository quotationTemplateRepository;

    public QuotationTemplateService(QuotationTemplateRepository quotationTemplateRepository) {
        this.quotationTemplateRepository = quotationTemplateRepository;
    }

    public List<QuotationTemplate> list() {
        return quotationTemplateRepository.findAll();
    }

    public QuotationTemplate getById(Long id) {
        return quotationTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation template not found"));
    }

    @Transactional
    public QuotationTemplate create(String name, String header, String footer, String terms) {
        return quotationTemplateRepository.save(QuotationTemplate.builder()
                .name(name).header(header).footer(footer).terms(terms).build());
    }

    @Transactional
    public QuotationTemplate update(Long id, String name, String header, String footer, String terms) {
        QuotationTemplate template = getById(id);
        template.setName(name);
        template.setHeader(header);
        template.setFooter(footer);
        template.setTerms(terms);
        return quotationTemplateRepository.save(template);
    }

    @Transactional
    public void delete(Long id) {
        quotationTemplateRepository.delete(getById(id));
    }
}
