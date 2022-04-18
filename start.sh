which caddy || echo  "检测到未安装Caddy，请安装Caddy！"
which python3 || echo  "检测到未安装Python3，请安装Python3！"
python3 -m pip list | grep hug || echo "检测到未安装hug模块，请使用pip install hug安装！"
python3 -m pip list | grep requests || echo "检测到未安装requests模块，请使用pip install hug安装！"

cd `dirname $0`
caddy run -config `dirname $0`/Caddyfile & python3 -m hug -f `dirname $0`/backend/app.py -p 9001
