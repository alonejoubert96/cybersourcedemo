package com.example.cybersourcedemo.controller.api;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/qr")
public class QrCodeController {

    @GetMapping(produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateQr(@RequestParam String url) throws WriterException, IOException {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 300, 300);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(out.toByteArray());
    }
}
