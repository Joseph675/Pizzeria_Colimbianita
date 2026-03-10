import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';

import SockJS from 'sockjs-client';


@Injectable({ providedIn: 'root' })
export class RfidService {
    private client: Client;
    /** Subject que mantiene el último UID escaneado */
    public uid$ = new BehaviorSubject<string | null>(null);

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/rfid-ws'),
            reconnectDelay: 5000
        });
        console.log('Conectando al servidor de RFID...');
        this.client.onConnect = () => {
            // Nos suscribimos al topic donde publicas el UID
            this.client.subscribe('/topic/rfid', (msg: IMessage) => {
                // Si envías un JSON como {"uid":"..."}
                let payload: any;

                try {
                    payload = JSON.parse(msg.body);
                    this.uid$.next(payload.uid);
                    console.log('UID recibido:', payload.uid);
                } catch {
                    // si envies solo el UID como texto plano, comenta lo de arriba y descomenta:
                    // this.uid$.next(msg.body);
                }
            });
        };
        this.client.activate();
    }
}
